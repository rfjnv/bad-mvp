import Link from "next/link";
import Image from "next/image";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";
import AddToCartButton from "@/components/AddToCartButton";
import { computePricePerUnit, formatPricePerUnitShort } from "@/lib/activeValue";

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
      className="group flex flex-col bg-white border border-border rounded-2xl overflow-hidden shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_16px_32px_rgba(0,0,0,0.09)] hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-square bg-bg-panel overflow-hidden">
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 220px"
          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
        />
        {outOfStock && (
          <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur text-red text-xs font-medium px-2.5 py-1 rounded-full border border-red/20">
            {t.catalog.outOfStock}
          </span>
        )}
        {!outOfStock && hasDiscount && (
          <span className="absolute top-2.5 left-2.5 bg-red text-white text-xs font-semibold px-2.5 py-1 rounded-full">
            −{discountPct}%
          </span>
        )}
      </div>
      <div className="p-3.5 flex flex-col gap-1 flex-1">
        <div className="text-xs text-text-dim">{product.brand}</div>
        <div className="text-[14px] font-medium leading-snug line-clamp-2 flex-1">{product.name}</div>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="font-semibold tracking-tight">{formatSum(product.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-text-dim line-through">{formatSum(product.oldPrice!)}</span>
          )}
        </div>
        {perUnit && (
          <div className="text-xs text-text-dim">{formatPricePerUnitShort(perUnit)}</div>
        )}
        <AddToCartButton productId={product.id} stock={product.stock} className="mt-2.5 w-full" />
      </div>
    </Link>
  );
}
