import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/validation";
import { normalizePhone } from "@/lib/format";
import { nextOrderNumber } from "@/lib/orderNumber";
import { getPaymentProvider } from "@/lib/payments";
import { deliveryFee } from "@/lib/delivery";

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
      const slugs = input.items.map((i) => i.slug);
      const products = await tx.product.findMany({ where: { slug: { in: slugs } } });
      const bySlug = new Map(products.map((p) => [p.slug, p]));

      // Скидка набора применяется только если ВСЕ товары набора присутствуют
      // в заказе ровно по 1 шт. — пересчитываем на сервере, не доверяя клиенту.
      let discountedIds = new Set<string>();
      let bundleDiscountPct = 0;
      if (input.appliedBundleSlug) {
        const bundle = await tx.bundle.findUnique({
          where: { slug: input.appliedBundleSlug },
          include: { items: true },
        });
        const qtyByProductId = new Map(
          input.items.flatMap((i) => {
            const p = bySlug.get(i.slug);
            return p ? [[p.id, i.quantity] as [string, number]] : [];
          })
        );
        const bundleValid =
          bundle?.isActive &&
          bundle.items.length > 0 &&
          bundle.items.every((bi) => qtyByProductId.get(bi.productId) === 1);
        if (bundleValid && bundle) {
          discountedIds = new Set(bundle.items.map((i) => i.productId));
          bundleDiscountPct = bundle.discountPct;
        }
      }

      let totalAmount = 0;
      const resolved: { productId: string; quantity: number; unitPrice: number }[] = [];
      for (const item of input.items) {
        const product = bySlug.get(item.slug);
        if (!product || !product.isActive) {
          throw new StockError(`Товар недоступен: ${item.slug}`);
        }
        if (product.stock < item.quantity) {
          throw new StockError(`Недостаточно товара на складе: ${product.name}`);
        }
        const unitPrice = discountedIds.has(product.id)
          ? Math.round(product.price * (1 - bundleDiscountPct / 100))
          : product.price;
        resolved.push({ productId: product.id, quantity: item.quantity, unitPrice });
        totalAmount += unitPrice * item.quantity;
      }

      // Заказ без товаров не должен превращаться в счёт за одну доставку
      if (resolved.length === 0 || totalAmount === 0) {
        throw new StockError("В корзине не осталось доступных товаров");
      }

      // Доставка считается на сервере от суммы товаров, а не приходит от клиента
      totalAmount += deliveryFee(totalAmount);

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
            create: resolved.map((r) => ({
              productId: r.productId,
              quantity: r.quantity,
              priceAtPurchase: r.unitPrice,
            })),
          },
        },
      });

      for (const r of resolved) {
        await tx.product.update({
          where: { id: r.productId },
          data: { stock: { decrement: r.quantity } },
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
