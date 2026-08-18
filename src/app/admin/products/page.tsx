"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  stock: number;
  isActive: boolean;
  category: { name: string };
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  async function refresh(query = "") {
    setLoading(true);
    const res = await fetch(`/api/admin/products${query ? `?q=${encodeURIComponent(query)}` : ""}`);
    setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/admin/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    refresh(q);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">{t.admin.products}</h1>
        <Link
          href="/admin/products/new"
          className="px-4 py-2 rounded-lg btn btn-primary font-semibold text-sm"
        >
          {t.common.create}
        </Link>
      </div>

      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          refresh(e.target.value);
        }}
        placeholder="Поиск по названию или бренду"
        className="px-3 py-2 rounded-lg bg-bg-panel-2 border border-border text-sm max-w-sm"
      />

      {loading ? (
        <p className="text-text-dim text-sm">{t.common.loading}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="text-left text-text-dim border-b border-border">
                <th className="py-2 pr-3">Название</th>
                <th className="py-2 pr-3">Категория</th>
                <th className="py-2 pr-3">Цена</th>
                <th className="py-2 pr-3">Остаток</th>
                <th className="py-2 pr-3">Статус</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-border">
                  <td className="py-2 pr-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-accent">
                      {p.name}
                    </Link>
                    <div className="text-xs text-text-dim">{p.brand}</div>
                  </td>
                  <td className="py-2 pr-3 text-text-dim">{p.category.name}</td>
                  <td className="py-2 pr-3">{formatSum(p.price)}</td>
                  <td className="py-2 pr-3">{p.stock}</td>
                  <td className="py-2 pr-3">
                    <button
                      onClick={() => toggleActive(p.id, p.isActive)}
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        p.isActive ? "bg-green-bg text-green" : "bg-bg-panel-2 text-text-dim"
                      }`}
                    >
                      {p.isActive ? "Активен" : "Выключен"}
                    </button>
                  </td>
                  <td className="py-2 pr-3">
                    <Link href={`/admin/products/${p.id}`} className="text-accent">
                      {t.common.edit}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
