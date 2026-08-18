"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { t } from "@/lib/i18n";
import { UNIT_BASIS } from "@/lib/activeValue";

interface Category {
  id: string;
  name: string;
}

export interface ProductFormValues {
  id?: string;
  slug: string;
  name: string;
  brand: string;
  categoryId: string;
  description: string;
  composition: string;
  dosage: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  imageUrl: string;
  sesCertNumber: string;
  sesCertFileUrl: string;
  sesCertIssuedAt: string;
  sesCertExpiresAt: string;
  conformityCertNumber: string;
  conformityCertFileUrl: string;
  conformityCertIssuedAt: string;
  conformityCertExpiresAt: string;
  activeSubstance: string;
  activeAmount: number | null;
  activeUnit: string;
  servingsPerPackage: number | null;
  isActive: boolean;
}

const EMPTY: ProductFormValues = {
  slug: "",
  name: "",
  brand: "",
  categoryId: "",
  description: "",
  composition: "",
  dosage: "",
  price: 0,
  oldPrice: null,
  stock: 0,
  imageUrl: "",
  sesCertNumber: "",
  sesCertFileUrl: "",
  sesCertIssuedAt: "",
  sesCertExpiresAt: "",
  conformityCertNumber: "",
  conformityCertFileUrl: "",
  conformityCertIssuedAt: "",
  conformityCertExpiresAt: "",
  activeSubstance: "",
  activeAmount: null,
  activeUnit: "",
  servingsPerPackage: null,
  isActive: true,
};

export default function ProductForm({
  categories,
  initial,
}: {
  categories: Category[];
  initial?: ProductFormValues;
}) {
  const router = useRouter();
  const [values, setValues] = useState<ProductFormValues>(initial ?? EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<"ses" | "conformity" | null>(null);

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(data.error ?? "Не удалось загрузить изображение");
      return;
    }
    set("imageUrl", data.url);
  }

  async function uploadDocument(kind: "ses" | "conformity", file: File) {
    setUploadingDoc(kind);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    form.append("kind", "document");
    const res = await fetch("/api/admin/upload", { method: "POST", body: form });
    const data = await res.json();
    setUploadingDoc(null);
    if (!res.ok) {
      setError(data.error ?? "Не удалось загрузить документ");
      return;
    }
    set(kind === "ses" ? "sesCertFileUrl" : "conformityCertFileUrl", data.url);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      ...values,
      oldPrice: values.oldPrice || null,
      sesCertNumber: values.sesCertNumber || null,
      sesCertFileUrl: values.sesCertFileUrl || null,
      sesCertIssuedAt: values.sesCertIssuedAt || null,
      sesCertExpiresAt: values.sesCertExpiresAt || null,
      conformityCertNumber: values.conformityCertNumber || null,
      conformityCertFileUrl: values.conformityCertFileUrl || null,
      conformityCertIssuedAt: values.conformityCertIssuedAt || null,
      conformityCertExpiresAt: values.conformityCertExpiresAt || null,
      activeSubstance: values.activeSubstance || null,
      activeAmount: values.activeAmount || null,
      activeUnit: values.activeUnit || null,
      servingsPerPackage: values.servingsPerPackage || null,
    };

    const res = await fetch(values.id ? `/api/admin/products/${values.id}` : "/api/admin/products", {
      method: values.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? t.common.error);
      return;
    }
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4 max-w-2xl">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Название">
          <input
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            required
          />
        </Field>
        <Field label="Slug">
          <input
            value={values.slug}
            onChange={(e) => set("slug", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            required
          />
        </Field>
        <Field label="Бренд">
          <input
            value={values.brand}
            onChange={(e) => set("brand", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            required
          />
        </Field>
        <Field label="Категория">
          <select
            value={values.categoryId}
            onChange={(e) => set("categoryId", e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            required
          >
            <option value="">— выберите —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Цена, сум">
          <input
            type="number"
            value={values.price}
            onChange={(e) => set("price", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            required
          />
        </Field>
        <Field label="Старая цена, сум (для скидки)">
          <input
            type="number"
            value={values.oldPrice ?? ""}
            onChange={(e) => set("oldPrice", e.target.value ? Number(e.target.value) : null)}
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
          />
        </Field>
        <Field label="Остаток, шт.">
          <input
            type="number"
            value={values.stock}
            onChange={(e) => set("stock", Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            required
          />
        </Field>
      </div>

      <div className="border-t border-border pt-4 flex flex-col gap-5">
        <div className="text-sm font-semibold">
          Документы <span className="text-text-dim font-normal">(необязательно)</span>
        </div>
        <CertFields
          title="Сертификат СЭС"
          number={values.sesCertNumber}
          onNumber={(v) => set("sesCertNumber", v)}
          fileUrl={values.sesCertFileUrl}
          uploading={uploadingDoc === "ses"}
          onUpload={(f) => uploadDocument("ses", f)}
          issuedAt={values.sesCertIssuedAt}
          onIssuedAt={(v) => set("sesCertIssuedAt", v)}
          expiresAt={values.sesCertExpiresAt}
          onExpiresAt={(v) => set("sesCertExpiresAt", v)}
        />
        <CertFields
          title="Сертификат соответствия"
          number={values.conformityCertNumber}
          onNumber={(v) => set("conformityCertNumber", v)}
          fileUrl={values.conformityCertFileUrl}
          uploading={uploadingDoc === "conformity"}
          onUpload={(f) => uploadDocument("conformity", f)}
          issuedAt={values.conformityCertIssuedAt}
          onIssuedAt={(v) => set("conformityCertIssuedAt", v)}
          expiresAt={values.conformityCertExpiresAt}
          onExpiresAt={(v) => set("conformityCertExpiresAt", v)}
        />
      </div>

      <Field label="Описание">
        <textarea
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border resize-none"
          required
        />
      </Field>
      <Field label="Состав">
        <textarea
          value={values.composition}
          onChange={(e) => set("composition", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border resize-none"
          required
        />
      </Field>
      <Field label="Способ применения">
        <textarea
          value={values.dosage}
          onChange={(e) => set("dosage", e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border resize-none"
          required
        />
      </Field>

      <div className="border-t border-border pt-4">
        <div className="text-sm font-semibold mb-3">
          Цена за единицу вещества <span className="text-text-dim font-normal">(необязательно)</span>
        </div>
        <div className="grid sm:grid-cols-4 gap-4">
          <Field label="Вещество">
            <input
              value={values.activeSubstance}
              onChange={(e) => set("activeSubstance", e.target.value)}
              placeholder="Витамин D3"
              className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            />
          </Field>
          <Field label="Кол-во на порцию">
            <input
              type="number"
              value={values.activeAmount ?? ""}
              onChange={(e) => set("activeAmount", e.target.value ? Number(e.target.value) : null)}
              placeholder="5000"
              className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            />
          </Field>
          <Field label="Единица">
            <select
              value={values.activeUnit}
              onChange={(e) => set("activeUnit", e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            >
              <option value="">—</option>
              {Object.keys(UNIT_BASIS).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Порций в упаковке">
            <input
              type="number"
              value={values.servingsPerPackage ?? ""}
              onChange={(e) => set("servingsPerPackage", e.target.value ? Number(e.target.value) : null)}
              placeholder="120"
              className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
            />
          </Field>
        </div>
        <p className="text-xs text-text-dim mt-2">
          Заполните, чтобы на карточке товара показывалась цена за 1000 МЕ / 100 мг и т.п. —
          так покупатель сравнивает не упаковки, а реальную ценность.
        </p>
      </div>

      <Field label="Изображение">
        <div className="flex items-center gap-3">
          {values.imageUrl && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-bg-panel-2 shrink-0">
              <Image src={values.imageUrl} alt="" fill className="object-cover" />
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
      </Field>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.isActive}
          onChange={(e) => set("isActive", e.target.checked)}
        />
        Активен (показывается в каталоге)
      </label>

      {error && (
        <div className="bg-red-bg border border-red/30 text-red rounded-lg px-3 py-2 text-sm">
          {error}
        </div>
      )}

      <button
        disabled={submitting}
        className="px-4 py-3 rounded-lg btn btn-primary font-semibold disabled:opacity-60 w-max"
      >
        {t.common.save}
      </button>
    </form>
  );
}

function CertFields({
  title,
  number,
  onNumber,
  fileUrl,
  uploading,
  onUpload,
  issuedAt,
  onIssuedAt,
  expiresAt,
  onExpiresAt,
}: {
  title: string;
  number: string;
  onNumber: (v: string) => void;
  fileUrl: string;
  uploading: boolean;
  onUpload: (file: File) => void;
  issuedAt: string;
  onIssuedAt: (v: string) => void;
  expiresAt: string;
  onExpiresAt: (v: string) => void;
}) {
  return (
    <div className="bg-bg-panel-2 border border-border rounded-lg p-3 flex flex-col gap-3">
      <div className="text-sm font-medium">{title}</div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Field label="Номер">
          <input
            value={number}
            onChange={(e) => onNumber(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-border"
          />
        </Field>
        <Field label="Дата выдачи">
          <input
            type="date"
            value={issuedAt}
            onChange={(e) => onIssuedAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-border"
          />
        </Field>
        <Field label="Действителен до">
          <input
            type="date"
            value={expiresAt}
            onChange={(e) => onExpiresAt(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-border"
          />
        </Field>
      </div>
      <div className="flex items-center gap-3">
        {fileUrl && (
          <a href={fileUrl} target="_blank" rel="noreferrer" className="text-xs link-action">
            Открыть загруженный файл
          </a>
        )}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
          }}
          className="text-sm"
        />
        {uploading && <span className="text-sm text-text-dim">Загрузка...</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-sm font-medium mb-1">{label}</div>
      {children}
    </div>
  );
}
