import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/format";
import { nextOrderNumber } from "@/lib/orderNumber";
import { getPaymentProvider } from "@/lib/payments";

export async function POST(req: NextRequest) {
  const json = await req.json().catch(() => null);
  const parsed = checkoutSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Проверьте правильность заполнения формы", issues: parsed.data },
      { status: 400 }
    );
  }
  const input = parsed.data;
  const phone = normalizePhone(input.customerPhone);
  if (!phone) {
    return NextResponse.json({ error: "Неверный формат телефона" }, { status: 400 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const productIds = input.items.map((i) => i.productId);
      const products = await tx.product.findMany({ where: { id: { in: productIds } } });
      const byId = new Map(products.map((p) => [p.id, p]));

      // Скидка набора применяется только если ВСЕ товары набора присутствуют
      // в заказе ровно по 1 шт. — пересчитываем на сервере, не доверяя клиенту.
      let discountedIds = new Set<string>();
      let bundleDiscountPct = 0;
      if (input.appliedBundleSlug) {
        const bundle = await tx.bundle.findUnique({
          where: { slug: input.appliedBundleSlug },
          include: { items: true },
        });
        const qtyById = new Map(input.items.map((i) => [i.productId, i.quantity]));
        const bundleValid =
          bundle?.isActive &&
          bundle.items.length > 0 &&
          bundle.items.every((bi) => qtyById.get(bi.productId) === 1);
        if (bundleValid && bundle) {
          discountedIds = new Set(bundle.items.map((i) => i.productId));
          bundleDiscountPct = bundle.discountPct;
        }
      }

      let totalAmount = 0;
      const itemPrices = new Map<string, number>();
      for (const item of input.items) {
        const product = byId.get(item.productId);
        if (!product || !product.isActive) {
          throw new StockError(`Товар недоступен: ${item.productId}`);
        }
        if (product.stock < item.quantity) {
          throw new StockError(`Недостаточно товара на складе: ${product.name}`);
        }
        const unitPrice = discountedIds.has(item.productId)
          ? Math.round(product.price * (1 - bundleDiscountPct / 100))
          : product.price;
        itemPrices.set(item.productId, unitPrice);
        totalAmount += unitPrice * item.quantity;
      }

      const orderNumber = await nextOrderNumber(tx);

      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: input.customerName,
          customerPhone: phone,
          customerAddress: input.customerAddress,
          comment: input.comment || null,
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === "CASH" ? "PENDING" : "PENDING",
          totalAmount,
          items: {
            create: input.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtPurchase: itemPrices.get(item.productId)!,
            })),
          },
        },
      });

      for (const item of input.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      return order;
    });

    let paymentUrl: string | null = null;
    if (input.paymentMethod === "PAYME" || input.paymentMethod === "CLICK") {
      const provider = getPaymentProvider(input.paymentMethod);
      const created = await provider.createPayment({
        orderId: result.id,
        orderNumber: result.orderNumber,
        amount: result.totalAmount,
        returnUrl: `${req.nextUrl.origin}/checkout/success?orderId=${result.id}`,
      });
      paymentUrl = created.paymentUrl;
    }

    return NextResponse.json({
      orderId: result.id,
      orderNumber: result.orderNumber,
      paymentUrl,
    });
  } catch (err) {
    if (err instanceof StockError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Не удалось создать заказ" }, { status: 500 });
  }
}

class StockError extends Error {}
