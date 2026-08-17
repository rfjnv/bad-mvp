"use client";

import { useState } from "react";
import Image from "next/image";
import { t } from "@/lib/i18n";

export interface CertInfo {
  label: string;
  number: string | null;
  fileUrl: string | null;
  issuedAt: string | null;
  expiresAt: string | null;
}

function isPdf(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf");
}

function formatDate(iso: string): string {
  // Даты сертификатов хранятся без времени — форматируем по UTC, чтобы
  // часовой пояс браузера не сдвигал день на -1.
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function DocumentsSection({ items }: { items: CertInfo[] }) {
  const [preview, setPreview] = useState<string | null>(null);
  const visible = items.filter((i) => i.number);
  if (visible.length === 0) return null;

  return (
    <div className="bg-green-bg rounded-2xl p-4 flex gap-3">
      <span className="shrink-0 w-9 h-9 rounded-full bg-white flex items-center justify-center text-green">
        <ShieldIcon />
      </span>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-green mb-2 text-sm">{t.product.documents}</div>
        <div className="flex flex-col gap-3">
          {visible.map((item) => {
            const expired = item.expiresAt ? new Date(item.expiresAt) < new Date() : false;
            const fileIsPdf = item.fileUrl ? isPdf(item.fileUrl) : false;

            return (
              <div key={item.label} className="bg-white rounded-xl p-3 flex gap-3">
                {item.fileUrl && !fileIsPdf ? (
                  <button
                    onClick={() => setPreview(item.fileUrl)}
                    className="relative w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-bg-panel border border-border"
                    aria-label={t.product.docView}
                  >
                    <Image src={item.fileUrl} alt={item.label} fill className="object-cover" />
                  </button>
                ) : (
                  <div className="w-14 h-14 shrink-0 rounded-lg bg-bg-panel border border-border flex items-center justify-center text-text-dim">
                    <DocIcon />
                  </div>
                )}

                <div className="min-w-0 text-sm flex-1">
                  <div className="font-medium">{item.label}</div>
                  <div className="text-text-dim">
                    {t.product.docNumber}: <span className="text-text">{item.number}</span>
                  </div>
                  {(item.issuedAt || item.expiresAt) && (
                    <div className="text-xs text-text-dim mt-0.5">
                      {item.issuedAt && `${t.product.docIssued}: ${formatDate(item.issuedAt)}`}
                      {item.issuedAt && item.expiresAt && " · "}
                      {item.expiresAt && (
                        <span className={expired ? "text-red font-medium" : undefined}>
                          {expired ? t.product.docExpired : `${t.product.docExpires}: ${formatDate(item.expiresAt)}`}
                        </span>
                      )}
                    </div>
                  )}

                  {item.fileUrl ? (
                    fileIsPdf ? (
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-accent font-medium mt-1 inline-block"
                      >
                        {t.product.docOpenPdf}
                      </a>
                    ) : (
                      <button
                        onClick={() => setPreview(item.fileUrl)}
                        className="text-xs text-accent font-medium mt-1"
                      >
                        {t.product.docView}
                      </button>
                    )
                  ) : (
                    <div className="text-xs text-text-dim mt-1">{t.product.docNoFile}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
        >
          <div className="relative max-w-2xl w-full max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreview(null)}
              aria-label={t.product.docClose}
              className="absolute -top-10 right-0 sm:-right-10 sm:top-0 w-9 h-9 rounded-full bg-white flex items-center justify-center text-text"
            >
              ✕
            </button>
            <div className="relative w-full h-[75vh] rounded-2xl overflow-hidden bg-white">
              <Image src={preview} alt="" fill className="object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 2 4 5v6c0 5 3.4 8.7 8 10 4.6-1.3 8-5 8-10V5l-8-3Z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
