import Link from "next/link";
import { categoryColor } from "@/lib/categoryStyle";

function tint(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

function PillIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <rect x="6.5" y="2.5" width="11" height="19" rx="5.5" stroke={color} strokeWidth="1.8" />
      <path d="M6.5 9.5H17.5" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

export default function CategoryTile({ slug, name }: { slug: string; name: string }) {
  const color = categoryColor(slug);
  const bg = tint(color, 0.9);

  return (
    <Link
      href={`/catalog?category=${slug}`}
      className="flex flex-col items-center gap-3 bg-white border border-border rounded-2xl px-4 py-6 text-center hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 transition-all duration-300"
    >
      <span
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{ backgroundColor: bg }}
      >
        <PillIcon color={color} />
      </span>
      <span className="font-medium text-[15px]">{name}</span>
    </Link>
  );
}
