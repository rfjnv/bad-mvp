"use client";

import { useEffect, useState } from "react";
import { t } from "@/lib/i18n";

interface Category {
  id: string;
  slug: string;
  name: string;
  sortOrder: number;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/categories");
    setCategories(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, name, sortOrder }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t.common.error);
      return;
    }
    setSlug("");
    setName("");
    setSortOrder(0);
    refresh();
  }

  async function remove(id: string) {
    setError(null);
    const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t.common.error);
      return;
    }
    refresh();
  }

  async function updateSort(id: string, value: number) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: value }),
    });
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">{t.admin.categories}</h1>

      <form onSubmit={create} className="bg-bg-panel border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название"
          className="flex-1 px-3 py-2 rounded-lg bg-bg-panel-2 border border-border text-sm"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="slug (латиница)"
          className="flex-1 px-3 py-2 rounded-lg bg-bg-panel-2 border border-border text-sm"
        />
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          placeholder="Порядок"
          className="w-24 px-3 py-2 rounded-lg bg-bg-panel-2 border border-border text-sm"
        />
        <button className="px-4 py-2 rounded-lg bg-accent text-white font-semibold text-sm">
          {t.common.create}
        </button>
      </form>

      {error && (
        <div className="bg-red-bg border border-red/30 text-red rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-text-dim text-sm">{t.common.loading}</p>
      ) : (
        <div className="bg-bg-panel border border-border rounded-xl divide-y divide-border">
          {categories.map((c) => (
            <div key={c.id} className="flex items-center gap-3 px-4 py-3">
              <div className="flex-1">
                <div className="font-medium text-sm">{c.name}</div>
                <div className="text-xs text-text-dim">{c.slug}</div>
              </div>
              <input
                type="number"
                defaultValue={c.sortOrder}
                onBlur={(e) => updateSort(c.id, Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-bg-panel-2 border border-border text-sm"
              />
              <button
                onClick={() => remove(c.id)}
                className="text-red text-sm font-medium"
              >
                {t.common.delete}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
