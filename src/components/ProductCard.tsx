import Link from "next/link";
import Image from "next/image";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import AddToCartButton from "@/components/AddToCartButton";
import { computePricePerUnit, formatPricePerUnitShort } from "@/lib/activeValue";
import { BLUR_PLACEHOLDER } from "@/lib/imagePlaceholder";
import { categoryColor } from "@/lib/categoryColors";

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

/** Банка стоит на подложке цвета своей категории — как линейка на полке */
export default function ProductCard({
  product,
  categorySlug,
  bestValue = false,
}: {
  product: ProductCardData;
  categorySlug?: string;
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
  const color = categoryColor(categorySlug);
  const href = `/product/${product.slug}`;

  return (
    <article className="product-card group flex flex-col gap-3">
      <div className="relative aspect-square rounded-3xl overflow-hidden" style={{ backgroundColor: color.tint }}>
        <Link href={href} tabIndex={-1} aria-hidden="true" className="absolute inset-0">
          <Image
            src={product.imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 280px"
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
            className={`object-contain p-[12%] mix-blend-multiply brightness-[1.04] transition-transform duration-500 ease-out group-hover:scale-[1.06] group-hover:-rotate-2 ${
              outOfStock ? "opacity-40 grayscale" : ""
            }`}
          />
        </Link>
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {outOfStock && (
            <span className="text-[12px] font-semibold bg-white px-2.5 py-1 rounded-full">{t.catalog.outOfStock}</span>
          )}
          {!outOfStock && hasDiscount && (
            <span className="text-[12px] font-bold bg-red text-white px-2.5 py-1 rounded-full">−{discountPct}%</span>
          )}
          {!outOfStock && bestValue && (
            <span className="text-[12px] font-semibold bg-sun px-2.5 py-1 rounded-full">Выгоднее всех</span>
          )}
        </div>
        <AddToCartButton slug={product.slug} stock={product.stock} name={product.name} variant="icon" className="absolute bottom-3 right-3" />
      </div>

      <div className="flex flex-col gap-1 px-1">
        <span className="text-[12px] text-text-dim">{product.brand}</span>
        <Link href={href} className="text-[15px] font-medium leading-snug line-clamp-2 hover:underline underline-offset-4 decoration-2 decoration-sun">
          {product.name}
        </Link>
        <div className="flex flex-wrap items-baseline gap-x-2 mt-1 tabular">
          <span className="font-display text-[16px] font-bold">{formatSum(product.price)}</span>
          {hasDiscount && <span className="text-[13px] text-text-dim line-through">{formatSum(product.oldPrice!)}</span>}
        </div>
        {perUnit && <span className="text-[13px] text-text-dim tabular">{formatPricePerUnitShort(perUnit)}</span>}
      </div>
    </article>
  );
}
