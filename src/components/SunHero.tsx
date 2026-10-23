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

type CSSVars = React.CSSProperties & Record<`--${string}`, string | number>;
const delay = (d: string): CSSVars => ({ "--d": d });

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

  const samples: [number, number][] = [];
  for (let h = FROM_H; h <= TO_H + 0.001; h += 1 / 6) samples.push([h, elevationAt(date, h)]);
  const above = samples.filter(([, e]) => e > 0);
  const curve = above.map(([h, e], i) => `${i === 0 ? "M" : "L"}${x(h).toFixed(1)},${y(e).toFixed(1)}`).join(" ");
  const nowElevation = elevationAt(date, hours);
  const sun = nowElevation > 0 ? { h: hours, e: nowElevation, label: "сейчас" } : { h: noon, e: peak, label: "в полдень" };

  let total = 0;
  let toSun = 0;
  for (let i = 1; i < above.length; i++) {
    total += Math.hypot(x(above[i][0]) - x(above[i - 1][0]), y(above[i][1]) - y(above[i - 1][1]));
    if (above[i][0] <= sun.h) toSun = total;
  }
  const sunAt = total > 0 ? Math.min(1, toSun / total).toFixed(3) : "1";

  return (
    <section className="sun-hero bg-sun rounded-3xl sm:rounded-[36px] px-5 py-7 sm:p-12 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 lg:gap-12 items-center overflow-hidden">
      <div className="flex flex-col gap-5">
        <div className="text-[15px] font-semibold hero-rise" style={delay("0s")}>
          Ташкент, {dateFmt.format(date)}
        </div>

        <div className="display-mega hero-rise" style={delay("0.05s")}>
          <span className="sr-only">{peak} градусов</span>
          {/* Цифра набегает от нуля на чистом CSS (@property): сервер отдаёт итог, без JS тоже верно */}
          <span className="count-up" aria-hidden="true" style={{ "--to": peak } as CSSVars} />
          <span aria-hidden="true">°</span>
        </div>

        <h2 className="text-[22px] sm:text-[28px] max-w-md hero-rise" style={delay("0.2s")}>
          Так высоко сегодня поднимется солнце
        </h2>

        <p className="text-[17px] max-w-md leading-relaxed hero-rise" style={delay("0.35s")}>
          {dWindow ? (
            <>
              Выше {VITAMIN_D_THRESHOLD}° оно будет с{" "}
              <b className="tabular">{formatClock(dWindow.from)}</b> до <b className="tabular">{formatClock(dWindow.to)}</b>.
              Только в эти часы кожа вырабатывает витамин D. Если вы в это время в офисе, солнце проходит мимо.
            </>
          ) : (
            <>
              Витамин D вырабатывается, когда солнце выше {VITAMIN_D_THRESHOLD}°.
              {next && (
                <>
                  {" "}До <b>{dateFmt.format(next)}</b> оно туда не поднимется, сколько ни гуляй.
                </>
              )}
            </>
          )}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1 hero-rise" style={delay("0.45s")}>
          <Link href="/podbor" className="min-h-[54px] px-7 rounded-full btn btn-primary text-[16px] hover:!bg-white">
            Проверить свой образ жизни
          </Link>
          <Link
            href="/catalog?category=vitamin-d"
            className="min-h-[54px] px-6 rounded-full inline-flex items-center font-semibold border-2 border-text hover:bg-white transition-colors"
          >
            Витамин D
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

          {[15, 30, 60, 75].map((e) => (
            <line key={e} x1={PAD_X} x2={W - PAD_X} y1={y(e)} y2={y(e)} stroke="#0e1116" strokeOpacity={0.1} strokeWidth={1} />
          ))}
          <line x1={PAD_X} x2={W - PAD_X} y1={BASE_Y} y2={BASE_Y} stroke="#0e1116" strokeWidth={2.5} strokeLinecap="round" />

          {/* Время, когда витамин D реально вырабатывается: часть дуги выше порога */}
          <path d={`${curve} L${x(above[above.length - 1][0])},${BASE_Y} L${x(above[0][0])},${BASE_Y} Z`} fill="#ffffff" fillOpacity={0.7} clipPath="url(#sun-above-threshold)" />

          <g className="hero-fade" style={delay("0.9s")}>
            <line x1={PAD_X} x2={W - PAD_X} y1={y(VITAMIN_D_THRESHOLD)} y2={y(VITAMIN_D_THRESHOLD)} stroke="#0e1116" strokeDasharray="7 7" strokeWidth={2} />
            <text x={PAD_X} y={y(VITAMIN_D_THRESHOLD) + 26} textAnchor="start" className="text-[13px] font-semibold fill-text">
              порог 45°
            </text>
          </g>

          <path d={curve} fill="none" stroke="#0e1116" strokeWidth={3} strokeLinecap="round" className="sun-curve" pathLength={1} />

          <g className="hero-fade" style={delay("1.7s")}>
            <line x1={x(sun.h)} x2={x(sun.h)} y1={y(sun.e)} y2={BASE_Y} stroke="#0e1116" strokeWidth={1.5} strokeDasharray="3 5" />
            <text x={x(sun.h)} y={y(sun.e) - 32} textAnchor="middle" className="text-[13px] font-semibold fill-text">
              {sun.label}, {Math.round(sun.e)}°
            </text>
          </g>

          {/* SMIL, а не CSS offset-path: так работает и в Safari на iPhone. До старта прозрачно */}
          <g className="sun-motion" opacity={0}>
            <circle r={26} fill="#ffffff" fillOpacity={0.55} className="sun-glow" />
            <circle r={12} fill="#ffffff" stroke="#0e1116" strokeWidth={3} />
            <animate attributeName="opacity" from="0" to="1" dur="0.4s" begin="0.25s" fill="freeze" />
            <animateMotion path={curve} dur="1.8s" begin="0.25s" fill="freeze" calcMode="spline" keyPoints={`0;${sunAt}`} keyTimes="0;1" keySplines="0.33 0 0.2 1" />
          </g>
          <g className="sun-static">
            <circle cx={x(sun.h)} cy={y(sun.e)} r={26} fill="#ffffff" fillOpacity={0.55} />
            <circle cx={x(sun.h)} cy={y(sun.e)} r={12} fill="#ffffff" stroke="#0e1116" strokeWidth={3} />
          </g>

          {[6, 9, 12, 15, 18].map((h) => (
            <text key={h} x={x(h)} y={BASE_Y + 28} textAnchor="middle" className="text-[13px] fill-text" fillOpacity={0.6}>
              {h}:00
            </text>
          ))}
        </svg>
        <figcaption className="text-[13px] opacity-70">Расчёт по положению солнца над Ташкентом. Облака не учитываются.</figcaption>
      </figure>
    </section>
  );
}
