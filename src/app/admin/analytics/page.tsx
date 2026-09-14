"use client";

import { useEffect, useState } from "react";
import { formatSum } from "@/lib/format";

interface Analytics {
  days: number;
  funnel: { step: string; sessions: number }[];
  productStats: { slug: string; name: string; views: number; carts: number; rate: number | null }[];
  goals: { slug: string; title: string; sessions: number }[];
  conditions: { slug: string; title: string; sessions: number }[];
  searchStats: { query: string; count: number; zeroResults: number }[];
  timeline: { date: string; sessions: number; orders: number; revenue: number }[];
  bundleAdds: number;
  totalEvents: number;
}

const PERIODS = [7, 30, 90] as const;

export default function AdminAnalyticsPage() {
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/admin/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData);
  }, [days]);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Аналитика</h1>
        <div className="flex border border-border rounded-lg overflow-hidden">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setDays(p)}
              className={`px-4 min-h-[40px] text-sm font-medium transition-colors duration-150 ${
                days === p ? "bg-accent text-white" : "bg-white hover:bg-bg-panel"
              }`}
            >
              {p} дней
            </button>
          ))}
        </div>
      </div>

      {!data ? (
        <p className="text-text-dim">Загрузка…</p>
      ) : data.totalEvents === 0 ? (
        <div className="bg-bg-panel rounded-2xl p-6 text-text-dim max-w-xl">
          За выбранный период событий нет. Статистика появится, как только на сайт
          зайдут посетители — считаются просмотры, корзина, оформление и подбор.
        </div>
      ) : (
        <>
          <Funnel steps={data.funnel} />
          <Timeline rows={data.timeline} />

          <div className="grid lg:grid-cols-2 gap-6">
            <Section
              title="Подбор по цели"
              hint="Сколько сессий выбрали каждую цель на главной"
            >
              <Bars rows={data.goals.map((g) => ({ label: g.title, value: g.sessions }))} />
            </Section>
            <Section
              title="Подбор по условиям жизни"
              hint="Какие условия люди отмечают про себя — проверка идеи учредителя"
            >
              <Bars rows={data.conditions.map((c) => ({ label: c.title, value: c.sessions }))} />
            </Section>
          </div>

          <Section
            title="Товары: просмотр → корзина"
            hint="Доля сессий, которые после просмотра добавили товар. Низкая доля при многих просмотрах — цена или карточка не убеждают"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-text-dim border-b border-border">
                    <th className="py-2 pr-4 font-semibold">Товар</th>
                    <th className="py-2 px-3 font-semibold text-right">Просмотры</th>
                    <th className="py-2 px-3 font-semibold text-right">В корзину</th>
                    <th className="py-2 pl-3 font-semibold text-right">Конверсия</th>
                  </tr>
                </thead>
                <tbody>
                  {data.productStats.map((p) => (
                    <tr key={p.slug} className="border-b border-border last:border-b-0">
                      <td className="py-2.5 pr-4">{p.name}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{p.views}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums">{p.carts}</td>
                      <td className="py-2.5 pl-3 text-right tabular-nums font-medium">
                        {p.rate === null ? "—" : `${p.rate}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <div className="grid lg:grid-cols-2 gap-6">
            <Section
              title="Поиск"
              hint="Запросы без результатов — то, чего покупатели ждут, а в ассортименте нет"
            >
              {data.searchStats.length === 0 ? (
                <p className="text-sm text-text-dim">Поиском пока не пользовались.</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border">
                  {data.searchStats.map((s) => (
                    <li key={s.query} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <span className="font-mono truncate">{s.query}</span>
                      <span className="shrink-0 tabular-nums text-text-dim">
                        {s.count}×
                        {s.zeroResults > 0 && (
                          <span className="ml-2 text-red font-medium">{s.zeroResults} без результата</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Section>
            <Section title="Наборы" hint="Сессии, добавившие набор целиком">
              <div className="text-3xl font-semibold tabular-nums">{data.bundleAdds}</div>
            </Section>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-border rounded-2xl p-5 flex flex-col gap-4">
      <div>
        <h2 className="font-semibold">{title}</h2>
        {hint && <p className="text-[13px] text-text-dim mt-0.5">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

/** Воронка: ширина ступени — доля от первой, под ступенью — переход с предыдущей */
function Funnel({ steps }: { steps: { step: string; sessions: number }[] }) {
  const max = steps[0]?.sessions || 1;
  return (
    <Section title="Воронка" hint="Уникальные сессии на каждом шаге и доля перешедших с предыдущего">
      <div className="flex flex-col gap-2">
        {steps.map((s, i) => {
          const prev = i > 0 ? steps[i - 1].sessions : null;
          const stepRate = prev ? Math.round((s.sessions / prev) * 100) : null;
          const width = Math.max(4, Math.round((s.sessions / max) * 100));
          return (
            <div key={s.step} className="grid grid-cols-[180px_1fr_120px] sm:grid-cols-[220px_1fr_140px] items-center gap-3 text-sm">
              <span className="truncate">{s.step}</span>
              <div className="h-8 bg-bg-panel rounded-md overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${width}%` }} />
              </div>
              <span className="tabular-nums text-right">
                <span className="font-semibold">{s.sessions}</span>
                {stepRate !== null && <span className="text-text-dim ml-2">{stepRate}%</span>}
              </span>
            </div>
          );
        })}
        {steps[0].sessions > 0 && (
          <p className="text-[13px] text-text-dim mt-1">
            Сквозная конверсия в заказ:{" "}
            <span className="font-semibold text-text">
              {((steps[4].sessions / steps[0].sessions) * 100).toFixed(1)}%
            </span>
          </p>
        )}
      </div>
    </Section>
  );
}

function Bars({ rows }: { rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.every((r) => r.value === 0)) {
    return <p className="text-sm text-text-dim">Пока никто не выбирал.</p>;
  }
  return (
    <div className="flex flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[1fr_auto] gap-3 items-center text-sm">
          <div className="flex flex-col gap-1 min-w-0">
            <span className="truncate">{r.label}</span>
            <div className="h-1.5 bg-bg-panel rounded overflow-hidden">
              <div className="h-full bg-accent" style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
          </div>
          <span className="tabular-nums font-medium w-8 text-right">{r.value}</span>
        </div>
      ))}
    </div>
  );
}

/** Сессии и заказы по дням — столбики без библиотек */
function Timeline({ rows }: { rows: { date: string; sessions: number; orders: number; revenue: number }[] }) {
  const maxS = Math.max(1, ...rows.map((r) => r.sessions));
  const totalRevenue = rows.reduce((s, r) => s + r.revenue, 0);
  const totalOrders = rows.reduce((s, r) => s + r.orders, 0);
  const totalSessions = rows.reduce((s, r) => s + r.sessions, 0);
  return (
    <Section
      title="По дням"
      hint={`${totalSessions} сессий · ${totalOrders} заказов · ${formatSum(totalRevenue)}`}
    >
      <div className="flex items-end gap-[3px] h-32">
        {rows.map((r) => (
          <div key={r.date} className="flex-1 flex flex-col justify-end h-full relative group" title={`${r.date}: ${r.sessions} сессий, ${r.orders} заказов`}>
            <div className="bg-bg-panel rounded-t-sm" style={{ height: `${(r.sessions / maxS) * 100}%` }}>
              {r.orders > 0 && (
                <div className="w-full bg-accent rounded-t-sm" style={{ height: `${Math.min(100, (r.orders / Math.max(1, r.sessions)) * 100)}%` }} />
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[11px] text-text-dim">
        <span>{rows[0]?.date}</span>
        <span>{rows[rows.length - 1]?.date}</span>
      </div>
      <p className="text-[13px] text-text-dim">
        Серый столбик — сессии за день, тёмная часть — доля, дошедшая до заказа.
      </p>
    </Section>
  );
}
