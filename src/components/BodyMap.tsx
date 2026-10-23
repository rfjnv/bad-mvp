import { ZONES, IMMUNITY_LABEL, type ZoneId } from "@/lib/bodyMap";

const CX = 160;

/**
 * Правая половина силуэта: опорные точки (смещение от центра, y) от макушки
 * до промежности. Левая половина — зеркало. Через точки проводится сплайн,
 * поэтому контур плавный, а пропорции правятся одной цифрой.
 */
const RIGHT_HALF: [number, number][] = [
  [0, 14], [12, 17], [20, 26], [23, 40], [21, 54], [15, 64], [8, 70],
  [8, 78], [10, 85],
  [22, 90], [38, 95], [49, 102],
  [54, 114], [56, 132], [58, 152], [61, 172],
  [65, 196], [68, 220], [70, 234],
  [73, 246], [73, 257], [68, 266], [62, 263], [60, 251], [61, 239],
  [58, 222], [53, 198], [49, 176], [45, 154], [41, 132], [38, 121],
  [37, 140], [34, 162], [31, 184], [30, 198],
  [34, 216], [37, 234], [38, 250],
  [37, 276], [34, 304], [31, 326], [30, 340],
  [32, 360], [30, 382], [25, 404], [22, 414],
  [25, 424], [27, 432], [17, 435], [10, 430], [10, 419],
  [10, 404], [11, 382], [12, 358], [11, 338], [9, 314], [6, 290], [3, 264], [0, 252],
];

function smoothClosedPath(points: [number, number][]): string {
  const n = points.length;
  const p = (i: number) => points[(i + n) % n];
  let d = `M${p(0)[0]},${p(0)[1]}`;
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [p(i - 1), p(i), p(i + 1), p(i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
  }
  return d + " Z";
}

const SILHOUETTE = smoothClosedPath([
  ...RIGHT_HALF.map(([dx, y]): [number, number] => [CX + dx, y]),
  ...RIGHT_HALF.slice(1, -1).reverse().map(([dx, y]): [number, number] => [CX - dx, y]),
]);

/** Анатомические штрихи, которые видны всегда, — чтобы фигура читалась как тело, а не как манекен */
const DETAILS = [
  "M140,93 Q150,97 157,94", "M180,93 Q170,97 163,94",
  "M160,100 L160,192",
  "M147,330 Q142,336 147,342", "M173,330 Q178,336 173,342",
];

/** Органы: в покое еле видны, при включении зоны прорисовываются янтарной линией */
const ORGANS: Record<Exclude<ZoneId, "immunity">, { d: string; fill?: boolean }> = {
  brain: {
    d: "M148,36 C147,27 154,22 160,24 C166,22 173,27 172,36 C173,43 167,47 160,46 C153,47 147,43 148,36 Z M160,25 L160,45 M151,31 Q155,28 158,32 M162,32 Q165,28 169,31 M151,39 Q154,42 157,39 M163,39 Q166,42 169,39",
  },
  thyroid: {
    d: "M160,76 C157,71 150,70 150,75 C150,80 156,81 160,78 C164,81 170,80 170,75 C170,70 163,71 160,76 Z",
    fill: true,
  },
  heart: {
    d: "M171,131 C163,125 158,120 158,114 C158,110 161,107 165,107 C168,107 170,109 171,111 C172,109 174,107 177,107 C181,107 184,110 184,114 C184,120 179,125 171,131 Z",
    fill: true,
  },
  blood: {
    d: "M165,116 C150,108 132,104 119,106 C112,128 108,152 105,176 C102,200 100,222 97,244 M105,176 C109,190 112,200 113,214",
  },
  muscles: {
    d: "M206,124 C214,134 217,150 213,166 M210,166 C214,180 216,196 215,212",
  },
  bones: {
    d: "M174,244 C170,240 175,234 179,239 C181,234 188,237 184,243 L181,322 C185,326 181,332 177,328 C174,333 168,329 172,324 Z",
  },
  joints: {
    d: "M142,330 m-7,0 a7,7 0 1,0 14,0 a7,7 0 1,0 -14,0 M135,320 Q142,316 149,320 M135,343 Q142,347 149,343",
  },
};

function BodySvgContent({ active, scanKey, compact }: { active: Set<ZoneId>; scanKey: number; compact: boolean }) {
  const immunityOn = active.has("immunity");
  const s = compact ? 1.6 : 1;
  const glowId = compact ? "zone-glow-compact" : "zone-glow";
  return (
    <>
      <defs>
        <radialGradient id={glowId}>
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0.5" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${glowId}-scan`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--amber)" stopOpacity="0" />
          <stop offset="85%" stopColor="var(--amber)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--amber)" stopOpacity="0.9" />
        </linearGradient>
        <clipPath id={`${glowId}-clip`}>
          <path d={SILHOUETTE} />
        </clipPath>
      </defs>

      <ellipse
        cx={CX}
        cy={224}
        rx={96}
        ry={216}
        fill="none"
        strokeWidth={1.5 * s}
        strokeDasharray={`${4 * s} ${6 * s}`}
        className={`stroke-amber transition-opacity duration-700 ${immunityOn ? "opacity-100 body-halo" : "opacity-0"}`}
      />

      <g className="body-breathe">
        <path d={SILHOUETTE} strokeWidth={1.6 * s} strokeLinejoin="round" className="fill-bg-panel stroke-text" />

        <g clipPath={`url(#${glowId}-clip)`}>
          {ZONES.map((zone) => (
            <circle
              key={zone.id}
              cx={zone.x}
              cy={zone.y}
              r={34}
              fill={`url(#${glowId})`}
              className={`transition-opacity duration-700 ${active.has(zone.id) ? "opacity-100" : "opacity-0"}`}
            />
          ))}
          {/* Луч-скан: пересоздаётся по ключу на каждый тап и проходит сверху вниз один раз */}
          {scanKey > 0 && (
            <g key={scanKey} className="body-scan">
              <rect x={CX - 90} y={-60} width={180} height={60} fill={`url(#${glowId}-scan)`} />
            </g>
          )}
        </g>

        {DETAILS.map((d) => (
          <path key={d} d={d} fill="none" strokeWidth={s} strokeLinecap="round" className="stroke-text-dim opacity-30" />
        ))}

        {(Object.keys(ORGANS) as (keyof typeof ORGANS)[]).map((id) => {
          const organ = ORGANS[id];
          const on = active.has(id);
          return (
            <g key={id}>
              <path
                d={organ.d}
                fill="none"
                strokeWidth={s}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="stroke-text-dim opacity-20"
              />
              {organ.fill && (
                <path d={organ.d} className={`fill-amber transition-opacity duration-700 ${on ? "opacity-25" : "opacity-0"}`} />
              )}
              <path
                d={organ.d}
                pathLength={1}
                fill="none"
                strokeWidth={1.6 * s}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`stroke-amber organ-draw ${on ? "organ-on" : ""}`}
              />
            </g>
          );
        })}
      </g>

      {ZONES.map((zone) => {
        const on = active.has(zone.id);
        return (
          <g key={zone.id}>
            {on && <circle key={`ping-${zone.id}`} cx={zone.x} cy={zone.y} r={4 * s} className="fill-amber body-ping" />}
            <circle
              cx={zone.x}
              cy={zone.y}
              r={(on ? 4.5 : 3) * s}
              strokeWidth={1.4 * s}
              className={`transition-all duration-300 ${on ? "fill-amber stroke-bg" : "fill-bg stroke-text-dim"}`}
            />
          </g>
        );
      })}
    </>
  );
}

/** Компактная версия для телефона: только фигура, подписи — легендой рядом */
export function BodyMapCompact({ active, scanKey = 0 }: { active: Set<ZoneId>; scanKey?: number }) {
  const legend = [...ZONES.map((z) => ({ id: z.id, label: z.label })), { id: "immunity" as const, label: IMMUNITY_LABEL }];
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="58 0 204 444" className="h-[200px] w-auto shrink-0 overflow-visible" aria-hidden="true">
        <BodySvgContent active={active} scanKey={scanKey} compact />
      </svg>
      <ul className="m-0 p-0 list-none grid gap-1 text-[13px] leading-tight">
        {legend.map((item) => {
          const on = active.has(item.id);
          return (
            <li key={item.id} className={`flex items-center gap-2 transition-colors duration-300 ${on ? "text-text font-semibold" : "text-text-dim/60"}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${on ? "bg-amber" : "border border-text-dim/50"}`} />
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function BodyMap({ active, scanKey = 0 }: { active: Set<ZoneId>; scanKey?: number }) {
  const immunityOn = active.has("immunity");
  const count = active.size;

  return (
    <figure className="m-0 flex flex-col items-center gap-3">
      <svg
        viewBox="-60 0 440 444"
        className="w-full max-w-[440px] h-auto overflow-visible"
        role="img"
        aria-label={count === 0 ? "Силуэт человека, зоны не отмечены" : `Отмечено зон: ${count}`}
      >
        <BodySvgContent active={active} scanKey={scanKey} compact={false} />

        <text
          x={56}
          y={228}
          textAnchor="end"
          className={`text-[12px] transition-all duration-500 ${immunityOn ? "fill-amber font-semibold" : "fill-text-dim opacity-40"}`}
        >
          {IMMUNITY_LABEL}
        </text>

        {ZONES.map((zone) => {
          const on = active.has(zone.id);
          const labelX = zone.side === "left" ? 76 : 244;
          const lineEndX = zone.side === "left" ? 82 : 238;
          return (
            <g key={zone.id}>
              <line
                x1={zone.x}
                y1={zone.y}
                x2={lineEndX}
                y2={zone.labelY - 4}
                strokeWidth={1}
                className={`transition-all duration-500 ${on ? "stroke-amber opacity-100" : "stroke-border opacity-60"}`}
              />
              <text
                x={labelX}
                y={zone.labelY}
                textAnchor={zone.side === "left" ? "end" : "start"}
                className={`text-[12px] transition-all duration-500 ${on ? "fill-text font-semibold" : "fill-text-dim opacity-40"}`}
              >
                {zone.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="text-[13px] text-text-dim text-center max-w-[320px] min-h-[40px]">
        {count === 0
          ? "Отмечайте, что про вас, — на силуэте загорится, куда идёт то, чего может не хватать."
          : `Затронуто зон: ${count}. Это места, где участвуют вещества, которых при таком образе жизни обычно недостаёт.`}
      </figcaption>
    </figure>
  );
}
