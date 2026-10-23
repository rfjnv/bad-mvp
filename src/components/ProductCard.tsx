import Link from "next/link";
import Image from "next/image";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import AddToCartButton from "@/components/AddToCartButton";
import { computePricePerUnit, formatPricePerUnitShort } from "@/lib/activeValue";
import { BLUR_PLACEHOLDER } from "@/lib/imagePlaceholder";

export interface ProductCardData {
  id: string;
  slug: string;
  name: string;
  brand: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  imageUrl: string;
  activeSubstance?: string | null;
  activeAmount?: number | null;
  activeUnit?: string | null;
  servingsPerPackage?: number | null;
}

/**
 * Без рамки и тени: банка стоит на «глиняной» подложке, как на полке.
 * Цифры под названием — моно-этикетка, тот же голос, что на странице товара.
 */
export default function ProductCard({
  product,
  bestValue = false,
}: {
  product: ProductCardData;
  /** Минимальная цена за действующее вещество в своей категории */
  bestValue?: boolean;
}) {
  const outOfStock = product.stock <= 0;
  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPct = hasDiscount ? Math.round((1 - product.price / product.oldPrice!) * 100) : 0;
  const perUnit = computePricePerUnit({
    activeSubstance: product.activeSubstance ?? null,
    activeAmount: product.activeAmount ?? null,
    activeUnit: product.activeUnit ?? null,
    servingsPerPackage: product.servingsPerPackage ?? null,
    price: product.price,
  });
  const href = `/product/${product.slug}`;

  return (
    <article className="product-card group flex flex-col gap-3">
      <div className="relative aspect-[4/5] bg-bg-panel rounded-3xl overflow-hidden">
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            className={`object-contain p-[14%] mix-blend-multiply transition-transform duration-500 ease-out group-hover:scale-[1.04] ${
              outOfStock ? "opacity-50 grayscale" : ""
            }`}
          />
        </Link>
        {outOfStock ? (
          <span className="label-mono absolute top-3 left-3 text-text-dim">{t.catalog.outOfStock}</span>
        ) : (
          hasDiscount && <span className="label-mono absolute top-3 left-3 bg-amber text-white px-1.5 py-0.5 rounded-md">−{discountPct}%</span>
        )}
        <AddToCartButton slug={product.slug} stock={product.stock} variant="icon" className="absolute bottom-3 right-3" />
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <span className="label-mono text-text-dim">{product.brand}</span>
        <Link href={href} className="text-[14px] sm:text-[15px] leading-snug line-clamp-2 hover:underline underline-offset-4 decoration-border">
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 mt-0.5 tabular">
          <span className="text-[15px] font-medium">{formatSum(product.price)}</span>
          {hasDiscount && <span className="text-[13px] text-text-dim line-through">{formatSum(product.oldPrice!)}</span>}
        </div>
        {perUnit && (
          <span className={`label-mono mt-0.5 ${bestValue ? "text-green" : "text-amber"}`}>
            {formatPricePerUnitShort(perUnit)}
            {bestValue && <span className="block text-[10px] mt-0.5">● лучшая цена за вещество</span>}
          </span>
        )}
      </div>
    </article>
  );
}
