import Link from "next/link";
import CategoryIcon from "@/components/CategoryIcon";

export default function CategoryTile({ slug, name }: { slug: string; name: string }) {
  return (
    <Link
      href={`/catalog?category=${slug}`}
      className="group flex items-center gap-3 min-h-[64px] bg-white border border-border rounded-2xl px-4 py-4 hover:border-border-strong hover:bg-bg-panel transition-colors duration-150"
    >
      <span className="text-text-dim group-hover:text-text transition-colors duration-150 shrink-0">
        <CategoryIcon slug={slug} />
      </span>
      <span className="font-medium text-[15px] leading-tight tracking-tight">{name}</span>
    </Link>
  );
}
