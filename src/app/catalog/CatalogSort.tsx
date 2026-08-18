"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n";

const OPTIONS: [string, string][] = [
  ["", t.catalog.sortLabel],
  ["price_asc", t.catalog.sortPriceAsc],
  ["price_desc", t.catalog.sortPriceDesc],
  ["name_asc", t.catalog.sortNameAsc],
];

export default function CatalogSort() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get("sort") ?? "";

  function onChange(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (v) params.set("sort", v);
    else params.delete("sort");
    params.delete("page");
    router.push(`/catalog?${params.toString()}`);
  }

  return (
    <div className="relative shrink-0">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-4 pr-10 py-2 rounded-lg bg-white border border-border text-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/30"
      >
        {OPTIONS.map(([v, label]) => (
          <option key={v} value={v}>
            {label}
          </option>
        ))}
      </select>
      <svg
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </div>
  );
}
