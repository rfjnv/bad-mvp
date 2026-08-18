"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { t } from "@/lib/i18n";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY = {
  title: "",
  subtitle: "",
  imageUrl: "",
  linkUrl: "",
  sortOrder: 0,
  isActive: true,
};

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState(EMPTY);

  async function refresh() {
    setLoading(true);
    const res = await fetch("/api/admin/banners");
    setBanners(await res.json());
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

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/banners", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        subtitle: form.subtitle || null,
        linkUrl: form.linkUrl || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? t.common.error);
      return;
    }
    setForm(EMPTY);
    refresh();
  }

  async function toggleActive(b: Banner) {
    await fetch(`/api/admin/banners/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !b.isActive }),
    });
    refresh();
  }

  async function updateSort(id: string, value: number) {
    await fetch(`/api/admin/banners/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sortOrder: value }),
    });
    refresh();
  }

  async function remove(id: string) {
    await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
    refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold tracking-tight">{t.admin.banners}</h1>

      <form onSubmit={create} className="bg-bg-panel border border-border rounded-2xl p-5 flex flex-col gap-4 max-w-xl">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium mb-1">Заголовок</div>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border"
              required
            />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Подзаголовок</div>
            <input
              value={form.subtitle}
              onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border"
            />
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Ссылка (куда ведёт баннер)</div>
            <input
              value={form.linkUrl}
              onChange={(e) => setForm((f) => ({ ...f, linkUrl: e.target.value }))}
              placeholder="/catalog?category=vitamin-d"
              className="w-full px-3 py-2 rounded-lg bg-bg border border-border"
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
          <div className="text-sm font-medium mb-1">Изображение</div>
          <div className="flex items-center gap-3">
            {form.imageUrl && (
              <div className="relative w-24 h-14 rounded-lg overflow-hidden bg-bg border border-border shrink-0">
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
          {banners.map((b) => (
            <div key={b.id} className="flex items-center gap-4 bg-bg-panel border border-border rounded-2xl p-3">
              <div className="relative w-28 h-16 rounded-lg overflow-hidden bg-bg border border-border shrink-0">
                <Image src={b.imageUrl} alt={b.title} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{b.title}</div>
                {b.subtitle && <div className="text-xs text-text-dim">{b.subtitle}</div>}
                {b.linkUrl && <div className="text-xs text-accent truncate">{b.linkUrl}</div>}
              </div>
              <input
                type="number"
                defaultValue={b.sortOrder}
                onBlur={(e) => updateSort(b.id, Number(e.target.value))}
                className="w-16 px-2 py-1 rounded-lg bg-bg border border-border text-sm"
              />
              <button
                onClick={() => toggleActive(b)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                  b.isActive ? "bg-green-bg text-green" : "bg-bg text-text-dim"
                }`}
              >
                {b.isActive ? "Активен" : "Выключен"}
              </button>
              <button onClick={() => remove(b.id)} className="text-red text-sm font-medium">
                {t.common.delete}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
