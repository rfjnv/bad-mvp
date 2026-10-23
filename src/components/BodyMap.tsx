import { ZONES, IMMUNITY_LABEL, type ZoneId } from "@/lib/bodyMap";

const HEAD = { cx: 160, cy: 40, rx: 22, ry: 26 };
const NECK = { x: 150, y: 58, width: 20, height: 26, rx: 6 };
const TORSO =
  "M118,92 Q160,76 202,92 Q208,96 206,120 L198,170 Q192,205 192,236 L128,236 Q128,205 122,170 L114,120 Q112,96 118,92 Z";
const ARMS = ["118,100 106,170 100,232", "202,100 214,170 220,232"];
const LEGS = ["144,230 142,330 142,418", "176,230 178,330 178,418"];
const ARM_WIDTH = 20;
const LEG_WIDTH = 28;
const OUTLINE = 3;

/**
 * Силуэт, на котором загораются зоны. Контур — двумя слоями: снизу всё
 * чуть толще и цветом линии, сверху то же цветом заливки. Так руки, ноги
 * и торс сливаются в одну фигуру без внутренних швов.
 */
function Figure({ layer }: { layer: "outline" | "fill" }) {
  const isOutline = layer === "outline";
  const color = isOutline ? "stroke-text fill-text" : "stroke-bg-panel fill-bg-panel";
  const extra = isOutline ? OUTLINE : 0;
  return (
    <g className={color}>
      <ellipse {...HEAD} strokeWidth={extra} />
      <rect {...NECK} strokeWidth={extra} />
      <path d={TORSO} strokeWidth={extra} strokeLinejoin="round" />
      {ARMS.map((points) => (
        <polyline key={points} points={points} style={{ fill: "none" }} strokeWidth={ARM_WIDTH + extra} strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {LEGS.map((points) => (
        <polyline key={points} points={points} style={{ fill: "none" }} strokeWidth={LEG_WIDTH + extra} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </g>
  );
}

/** Компактная версия для телефона: только фигура, подписи — легендой рядом */
export function BodyMapCompact({ active }: { active: Set<ZoneId> }) {
  const immunityOn = active.has("immunity");
  const legend = [...ZONES.map((z) => ({ id: z.id, label: z.label })), { id: "immunity" as const, label: IMMUNITY_LABEL }];
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="62 0 196 440" className="h-[200px] w-auto shrink-0" aria-hidden="true">
        <defs>
          <radialGradient id="zone-glow-compact">
            <stop offset="0%" stopColor="var(--green)" stopOpacity="0.5" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse
          cx={160}
          cy={222}
          rx={90}
          ry={214}
          fill="none"
          strokeWidth={3}
          strokeDasharray="8 10"
          className={`stroke-green transition-opacity duration-500 ${immunityOn ? "opacity-100 body-halo" : "opacity-0"}`}
        />
        <Figure layer="outline" />
        <Figure layer="fill" />
        {ZONES.map((zone) => {
          const on = active.has(zone.id);
          return (
            <g key={zone.id}>
              <circle cx={zone.x} cy={zone.y} r={34} fill="url(#zone-glow-compact)" className={`transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`} />
              {on && <circle cx={zone.x} cy={zone.y} r={8} className="fill-green body-ping" />}
              <circle
                cx={zone.x}
                cy={zone.y}
                r={on ? 9 : 5}
                strokeWidth={2.5}
                className={`transition-all duration-300 ${on ? "fill-green stroke-white" : "fill-white stroke-text-dim"}`}
              />
            </g>
          );
        })}
      </svg>
      <ul className="m-0 p-0 list-none grid gap-1 text-[13px] leading-tight">
        {legend.map((item) => {
          const on = active.has(item.id);
          return (
            <li key={item.id} className={`flex items-center gap-2 transition-colors duration-300 ${on ? "text-text font-semibold" : "text-text-dim/60"}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 transition-colors duration-300 ${on ? "bg-green" : "border border-text-dim/50"}`} />
              {item.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function BodyMap({ active }: { active: Set<ZoneId> }) {
  const immunityOn = active.has("immunity");
  const count = active.size;

  return (
    <figure className="m-0 flex flex-col items-center gap-3">
      <svg
        viewBox="-60 0 440 440"
        className="w-full max-w-[440px] h-auto overflow-visible"
        role="img"
        aria-label={
          count === 0 ? "Силуэт человека, зоны не отмечены" : `Отмечено зон: ${count}`
        }
      >
        <defs>
          <radialGradient id="zone-glow">
            <stop offset="0%" stopColor="var(--green)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--green)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse
          cx={160}
          cy={222}
          rx={90}
          ry={214}
          fill="none"
          strokeWidth={1.5}
          strokeDasharray="4 6"
          className={`stroke-green transition-opacity duration-500 ${immunityOn ? "opacity-100 body-halo" : "opacity-0"}`}
        />
        <text
          x={62}
          y={226}
          textAnchor="end"
          className={`text-[12px] transition-all duration-500 ${
            immunityOn ? "fill-green font-semibold" : "fill-text-dim opacity-40"
          }`}
        >
          {IMMUNITY_LABEL}
        </text>

        <Figure layer="outline" />
        <Figure layer="fill" />

        {ZONES.map((zone) => {
          const on = active.has(zone.id);
          const labelX = zone.side === "left" ? 76 : 244;
          const lineEndX = zone.side === "left" ? 82 : 238;
          return (
            <g key={zone.id}>
              <circle
                cx={zone.x}
                cy={zone.y}
                r={28}
                fill="url(#zone-glow)"
                className={`transition-opacity duration-500 ${on ? "opacity-100" : "opacity-0"}`}
              />
              <line
                x1={zone.x}
                y1={zone.y}
                x2={lineEndX}
                y2={zone.labelY - 4}
                strokeWidth={1}
                className={`transition-all duration-500 ${on ? "stroke-green opacity-100" : "stroke-border opacity-60"}`}
              />
              {/* key по состоянию: при включении круг пересоздаётся и пинг стартует заново */}
              {on && <circle key={`ping-${zone.id}`} cx={zone.x} cy={zone.y} r={5} className="fill-green body-ping" />}
              <circle
                cx={zone.x}
                cy={zone.y}
                r={on ? 5.5 : 3.5}
                strokeWidth={1.5}
                className={`transition-all duration-300 ${on ? "fill-green stroke-white" : "fill-white stroke-text-dim"}`}
              />
              <text
                x={labelX}
                y={zone.labelY}
                textAnchor={zone.side === "left" ? "end" : "start"}
                className={`text-[12px] transition-all duration-500 ${
                  on ? "fill-text font-semibold" : "fill-text-dim opacity-40"
                }`}
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
