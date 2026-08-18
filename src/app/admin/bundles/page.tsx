"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { formatSum } from "@/lib/format";
import { t } from "@/lib/i18n";

interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
}

interface Bundle {
  id: string;
  slug: string;
  name: string;
  description: string;
  discountPct: number;
  imageUrl: string;
  isActive: boolean;
  sortOrder: number;
  items: { product: Product }[];
}

const EMPTY = {
  slug: "",
  name: "",
  description: "",
  discountPct: 10,
  imageUrl: "",
  sortOrder: 0,
  productIds: [] as string[],
};

export default function AdminBundlesPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY);

  async function refresh() {
    setLoading(true);
    const [bundlesRes, productsRes] = await Promise.all([
      fetch("/api/admin/bundles"),
      fetch("/api/admin/products"),
    ]);
    setBundles(await bundlesRes.json());
    setProducts(await productsRes.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Не удалось загрузить изображение");
      return;
    }
    setForm((f) => ({ ...f, imageUrl: data.url }));
  }

  function toggleProduct(id: string) {
    setForm((f) => ({
      ...f,
      productIds: f.productIds.includes(id)
        ? f.productIds.filter((p) => p !== id)
        : [...f.productIds, id],
    }));
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/bundles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t.common.error);
      return;
    }
    setForm(EMPTY);
    refresh();
  }

  async function toggleActive(b: Bundle) {
    await fetch(`/api/admin/bundles/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/bundles/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.bundles}</h1>

      <form onSubmit={create} className="bg-bg-panel border border-border rounded-2xl p-5 flex flex-col gap-4 max-w-2xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-1">Название</div>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border"
              required
            />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Slug</div>
            <input
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border"
              required
            />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Скидка, %</div>
            <input
              type="number"
              value={form.discountPct}
              onChange={(e) => setForm((f) => ({ ...f, discountPct: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border"
              required
            />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Порядок показа</div>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) }))}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border"
            />
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Описание</div>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={2}
            className="w-full px-3 py-2 rounded-lg bg-bg border border-border resize-none"
            required
          />
        </div>

        <div>
          <div className="text-sm font-medium mb-1">Изображение</div>
          <div className="flex items-center gap-3">
            {form.imageUrl && (
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-bg border border-border shrink-0">
                <Image src={form.imageUrl} alt="" fill className="object-cover" />
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
              className="text-sm"
            />
            {uploading && <span className="text-sm text-text-dim">Загрузка...</span>}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">
            Товары в наборе <span className="text-text-dim font-normal">(минимум 2)</span>
          </div>
          <div className="flex flex-col gap-1 max-h-64 overflow-y-auto border border-border rounded-lg p-2">
            {products.map((p) => (
              <label key={p.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-bg text-sm">
                <input
                  type="checkbox"
                  checked={form.productIds.includes(p.id)}
                  onChange={() => toggleProduct(p.id)}
                />
                {p.name} <span className="text-text-dim">— {formatSum(p.price)}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-bg border border-red/30 text-red rounded-lg px-3 py-2 text-sm">{error}</div>
        )}

        <button className="px-5 py-2.5 rounded-lg btn btn-primary font-semibold text-sm w-max">
          {t.common.create}
        </button>
      </form>

      {loading ? (
        <p className="text-text-dim text-sm">{t.common.loading}</p>
      ) : (
        <div className="flex flex-col gap-3">
          {bundles.map((b) => (
            <div key={b.id} className="flex items-start gap-4 bg-bg-panel border border-border rounded-2xl p-4">
              <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-bg border border-border shrink-0">
                <Image src={b.imageUrl} alt={b.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">
                  {b.name} <span className="text-accent text-sm">−{b.discountPct}%</span>
                </div>
                <div className="text-xs text-text-dim mt-0.5">
                  {b.items.map((i) => i.product.name).join(", ")}
                </div>
              </div>
              <button
                onClick={() => toggleActive(b)}
                className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium ${
                  b.isActive ? "bg-green-bg text-green" : "bg-bg text-text-dim"
                }`}
              >
                {b.isActive ? "Активен" : "Выключен"}
              </button>
              <button onClick={() => remove(b.id)} className="shrink-0 text-red text-sm font-medium">
                {t.common.delete}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
