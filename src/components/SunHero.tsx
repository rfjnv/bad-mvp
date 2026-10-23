import Link from "next/link";
import {
  VITAMIN_D_THRESHOLD,
  elevationAt,
  formatClock,
  nextDayAbove,
  solarNoon,
  tashkentNow,
  windowAbove,
} from "@/lib/sun";

const W = 600;
const H = 300;
const PAD_X = 8;
const BASE_Y = 250;
const MAX_E = 80;
const FROM_H = 5;
const TO_H = 21;

const x = (hours: number) => PAD_X + ((hours - FROM_H) / (TO_H - FROM_H)) * (W - PAD_X * 2);
const y = (elevation: number) => BASE_Y - (Math.max(0, elevation) / MAX_E) * (BASE_Y - 20);

const dateFmt = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", timeZone: "Asia/Tashkent" });

function daysWord(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "день";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return "дня";
  return "дней";
}

/**
 * Главный экран: дефицит, который нельзя почувствовать, показан цифрой,
 * которую можно проверить — высотой солнца над Ташкентом сегодня.
 */
export default function SunHero({ now = new Date() }: { now?: Date }) {
  const { date, hours } = tashkentNow(now);
  const noon = solarNoon(date);
  const peak = Math.round(elevationAt(date, noon));
  const dWindow = windowAbove(date, VITAMIN_D_THRESHOLD);
  const next = dWindow ? null : nextDayAbove(date, VITAMIN_D_THRESHOLD);
  const daysUntil = next ? Math.ceil((next.getTime() - date.getTime()) / 86_400_000) : 0;

  const samples: [number, number][] = [];
  for (let h = FROM_H; h <= TO_H + 0.001; h += 1 / 6) samples.push([h, elevationAt(date, h)]);
  const above = samples.filter(([, e]) => e > 0);
  const curve = above.map(([h, e], i) => `${i === 0 ? "M" : "L"}${x(h).toFixed(1)},${y(e).toFixed(1)}`).join(" ");
  const nowElevation = elevationAt(date, hours);
  const sun = nowElevation > 0 ? { h: hours, e: nowElevation, label: "сейчас" } : { h: noon, e: peak, label: "в полдень" };

  let total = 0;
  let toSun = 0;
  for (let i = 1; i < above.length; i++) {
    const seg = Math.hypot(x(above[i][0]) - x(above[i - 1][0]), y(above[i][1]) - y(above[i - 1][1]));
    total += seg;
    if (above[i][0] <= sun.h) toSun = total;
  }
  const sunAt = total > 0 ? Math.min(1, toSun / total).toFixed(3) : "1";

  return (
    <section className="sun-hero grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 lg:gap-14 items-end">
      <div className="flex flex-col gap-6">
        <div className="label-mono text-text-dim hero-rise" style={{ "--d": "0s" } as React.CSSProperties}>
          Ташкент · {dateFmt.format(date)} · 41,3° с. ш.
        </div>

        <div className="flex flex-col gap-4">
          <div className="display-mega hero-rise" style={{ "--d": "0.05s" } as React.CSSProperties}>
            <span className="sr-only">{peak} градусов</span>
            {/* Цифра набегает от нуля на чистом CSS (@property): сервер отдаёт итог, без JS тоже верно */}
            <span className="count-up" aria-hidden="true" style={{ "--to": peak } as React.CSSProperties} />
            <span className="text-amber" aria-hidden="true">°</span>
          </div>
          <h1 className="display-2 max-w-md hero-rise" style={{ "--d": "0.2s" } as React.CSSProperties}>
            так высоко поднимется солнце сегодня в&nbsp;полдень
          </h1>
        </div>

        {dWindow ? (
          <p className="text-[17px] text-text-dim max-w-md leading-relaxed hero-rise" style={{ "--d": "0.35s" } as React.CSSProperties}>
            Окно для витамина D сегодня —{" "}
            <span className="text-text font-medium tabular">
              {formatClock(dWindow.from)}–{formatClock(dWindow.to)}
            </span>
            . Если в это время вы в офисе, солнце проходит мимо вас.
          </p>
        ) : (
          <p className="text-[17px] text-text-dim max-w-md leading-relaxed hero-rise" style={{ "--d": "0.35s" } as React.CSSProperties}>
            Ниже {VITAMIN_D_THRESHOLD}° кожа почти не вырабатывает витамин D, сколько ни гуляй.
            {next && (
              <>
                {" "}
                Такое солнце вернётся только{" "}
                <span className="text-text font-medium">{dateFmt.format(next)}</span> — через{" "}
                <span className="text-text font-medium tabular">
                  {daysUntil} {daysWord(daysUntil)}
                </span>
                .
              </>
            )}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 hero-rise" style={{ "--d": "0.45s" } as React.CSSProperties}>
          <Link href="/podbor" className="min-h-[52px] px-6 rounded-lg btn btn-primary text-[15px]">
            Проверить свой день
            <span aria-hidden="true">→</span>
          </Link>
          <Link href="/catalog?category=vitamin-d" className="min-h-[52px] px-2 inline-flex items-center link-action text-[15px]">
            Витамин D в каталоге
          </Link>
        </div>
      </div>

      <figure className="m-0 flex flex-col gap-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label={`Путь солнца сегодня, максимум ${peak}°, порог ${VITAMIN_D_THRESHOLD}°`}>
          <defs>
            <clipPath id="sun-above-threshold">
              <rect x="0" y="0" width={W} height={y(VITAMIN_D_THRESHOLD)} />
            </clipPath>
          </defs>

          {[0, 15, 30, 60, 75].map((e) => (
            <line key={e} x1={PAD_X} x2={W - PAD_X} y1={y(e)} y2={y(e)} className="stroke-border" strokeWidth={e === 0 ? 1.5 : 1} />
          ))}

          {/* Площадь под дугой выше порога — время, когда витамин D реально вырабатывается */}
          <path d={`${curve} L${x(above[above.length - 1][0])},${BASE_Y} L${x(above[0][0])},${BASE_Y} Z`} className="fill-amber/25" clipPath="url(#sun-above-threshold)" />

          <g className="hero-fade" style={{ "--d": "0.9s" } as React.CSSProperties}>
          <line x1={PAD_X} x2={W - PAD_X} y1={y(VITAMIN_D_THRESHOLD)} y2={y(VITAMIN_D_THRESHOLD)} strokeDasharray="5 6" strokeWidth={1.5} className="stroke-amber" />
          <text x={W - PAD_X} y={y(VITAMIN_D_THRESHOLD) - 8} textAnchor="end" className="label-mono fill-amber">
            45° — порог витамина D
          </text>
          </g>

          <path d={curve} fill="none" strokeWidth={2} strokeLinecap="round" className="stroke-text sun-curve" pathLength={1} />

          <g className="hero-fade" style={{ "--d": "1.7s" } as React.CSSProperties}>
            <line x1={x(sun.h)} x2={x(sun.h)} y1={y(sun.e)} y2={BASE_Y} strokeWidth={1} strokeDasharray="2 4" className="stroke-text-dim" />
            <text x={x(sun.h)} y={y(sun.e) - 30} textAnchor="middle" className="label-mono fill-text">
              {sun.label} · {Math.round(sun.e)}°
            </text>
          </g>

          {/* Солнце выходит из-за горизонта и едет по дуге до своей позиции.
              SMIL, а не CSS offset-path: так работает и в Safari на iPhone.
              До старта таймлайна группа прозрачна — не мигает в углу */}
          <g className="sun-motion" opacity={0}>
            <circle r={22} className="fill-amber/20 sun-glow" />
            <circle r={9} className="fill-amber" />
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.25s" fill="freeze" />
            <animateMotion
              path={curve}
              dur="1.8s"
              begin="0.25s"
              fill="freeze"
              calcMode="spline"
              keyPoints={`0;${sunAt}`}
              keyTimes="0;1"
              keySplines="0.33 0 0.2 1"
            />
          </g>
          <g className="sun-static">
            <circle cx={x(sun.h)} cy={y(sun.e)} r={22} className="fill-amber/20" />
            <circle cx={x(sun.h)} cy={y(sun.e)} r={9} className="fill-amber" />
          </g>

          {[6, 9, 12, 15, 18].map((h) => (
            <text key={h} x={x(h)} y={BASE_Y + 26} textAnchor="middle" className="label-mono fill-text-dim">
              {h}:00
            </text>
          ))}
        </svg>
        <figcaption className="text-[12px] text-text-dim">
          Расчёт по положению солнца для Ташкента, без учёта облаков.
        </figcaption>
      </figure>
    </section>
  );
}
