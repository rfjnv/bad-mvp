"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { t } from "@/lib/i18n";

const LINKS = [
  { href: "/admin", label: t.admin.dashboard },
  { href: "/admin/products", label: t.admin.products },
  { href: "/admin/orders", label: t.admin.orders },
  { href: "/admin/categories", label: t.admin.categories },
  { href: "/admin/banners", label: t.admin.banners },
  { href: "/admin/bundles", label: t.admin.bundles },
  { href: "/admin/subscriptions", label: t.admin.subscriptions },
  { href: "/admin/telegram", label: t.admin.telegram },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") return null;

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <div className="border-b border-border bg-bg-panel">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-1 overflow-x-auto">
        {LINKS.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                active ? "border-accent text-text" : "border-transparent text-text-dim"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
        <button
          onClick={logout}
          className="ml-auto px-3 py-3 text-sm font-medium text-text-dim whitespace-nowrap"
        >
          {t.admin.logout}
        </button>
      </div>
    </div>
  );
}
