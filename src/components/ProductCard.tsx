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

export default function ProductCard({ product }: { product: ProductCardData }) {
  const outOfStock = product.stock <= 0;
  const hasDiscount = Boolean(product.oldPrice && product.oldPrice > product.price);
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : 0;
  const perUnit = computePricePerUnit({
    activeSubstance: product.activeSubstance ?? null,
    activeAmount: product.activeAmount ?? null,
    activeUnit: product.activeUnit ?? null,
    servingsPerPackage: product.servingsPerPackage ?? null,
    price: product.price,
  });

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden hover:border-border-strong transition-colors duration-150"
    >
      <div className="relative aspect-square bg-bg-panel overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 220px"
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
          className="object-contain p-3 mix-blend-multiply transition-transform duration-200 group-hover:scale-[1.03]"
        />
        {outOfStock && (
          <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur text-red text-xs font-medium px-2.5 py-1 rounded-lg border border-red/20">
            {t.catalog.outOfStock}
          </span>
        )}
        {!outOfStock && hasDiscount && (
          <span className="absolute top-2.5 left-2.5 bg-red text-white text-xs font-semibold px-2.5 py-1 rounded-lg">
            −{discountPct}%
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-1 flex-1 border-t border-border">
        <div className="text-[13px] text-text-dim uppercase tracking-wide">{product.brand}</div>
        {/* На мобильном показываем три строки: дозировка и количество капсул
            стоят в конце названия, и именно они обрезались при line-clamp-2 */}
        <div className="text-[14px] font-medium leading-snug line-clamp-3 sm:line-clamp-2 flex-1">
          {product.name}
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-[17px] font-semibold tracking-tight">{formatSum(product.price)}</span>
          {hasDiscount && (
            <span className="text-[13px] text-text-dim line-through">{formatSum(product.oldPrice!)}</span>
          )}
        </div>
        {perUnit && (
          <div className="text-[13px] font-medium text-text border-l-2 border-border-strong pl-2 mt-0.5">
            {formatPricePerUnitShort(perUnit)}
          </div>
        )}
        <AddToCartButton slug={product.slug} stock={product.stock} className="mt-2.5 w-full" />
      </div>
    </Link>
  );
}
