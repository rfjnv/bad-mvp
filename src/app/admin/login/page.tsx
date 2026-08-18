"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { t } from "@/lib/i18n";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ login, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t.admin.loginError);
      setSubmitting(false);
      return;
    }
    router.push(searchParams.get("next") || "/admin");
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-20">
      <h1 className="text-xl font-bold mb-6 text-center">{t.admin.login}</h1>
      <form onSubmit={submit} className="flex flex-col gap-4">
        <div>
          <div className="text-sm font-medium mb-1">{t.admin.loginField}</div>
          <input
            value={login}
            onChange={(e) => setLogin(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
          />
        </div>
        <div>
          <div className="text-sm font-medium mb-1">{t.admin.password}</div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-bg-panel-2 border border-border"
          />
        </div>
        {error && (
          <div className="bg-red-bg border border-red/30 text-red rounded-lg px-3 py-2 text-sm">
            {error}
          </div>
        )}
        <button
          disabled={submitting}
          className="px-4 py-3 rounded-lg btn btn-primary font-semibold disabled:opacity-60"
        >
          {t.admin.loginSubmit}
        </button>
      </form>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
