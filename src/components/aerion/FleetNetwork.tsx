import { motion } from "motion/react";
import { AIRCRAFT, type ComponentKey } from "@/lib/fleet/data";
import { aircraftHealth, healthBand, similarAircraft } from "@/lib/fleet/engine";

const POS: Record<string, [number, number]> = {
  "AX-01": [120, 90], "AX-02": [300, 60], "AX-03": [480, 90],
  "AX-04": [120, 270], "AX-05": [300, 300], "AX-06": [480, 270],
};
const ring = { success: "stroke-success", warning: "stroke-warning", critical: "stroke-critical" };

interface Props { selectedId: string; component: ComponentKey; onSelect: (id: string) => void; className?: string }

export function FleetNetwork({ selectedId, component, onSelect, className }: Props) {
  const matches = similarAircraft(selectedId, component).map((m) => m.aircraft.id);
  const ids = AIRCRAFT.map((a) => a.id);
  const [sx, sy] = POS[selectedId];
  return (
    <svg viewBox="0 0 600 360" className={className} role="group" aria-label="Fleet network">
      {/* mesh */}
      {ids.flatMap((a, i) => ids.slice(i + 1).map((b) => (
        <line key={a + b} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} className="stroke-primary/10" strokeWidth="1" />
      )))}
      {matches.map((id) => (
        <motion.line key={selectedId + id + component} x1={sx} y1={sy} x2={POS[id][0]} y2={POS[id][1]}
          className="stroke-warning flow-line" strokeWidth="2"
          initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: 0.8 }} />
      ))}
      {AIRCRAFT.map((a) => {
        const [x, y] = POS[a.id];
        const h = aircraftHealth(a);
        const sel = a.id === selectedId;
        const match = matches.includes(a.id);
        return (
          <g key={a.id} transform={`translate(${x} ${y})`} className="cursor-pointer" role="button" tabIndex={0}
            aria-label={`${a.id} ${a.callsign}, health ${h}`} aria-pressed={sel}
            onClick={() => onSelect(a.id)} onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(a.id)}>
            {(sel || match) && (
              <circle r="44" className={sel ? "fill-primary/10 stroke-primary" : "fill-warning/10 stroke-warning"} strokeWidth="1">
                <animate attributeName="r" values="38;48;38" dur="2.4s" repeatCount="indefinite" />
              </circle>
            )}
            <circle r="32" className={`fill-surface ${ring[healthBand(h)]}`} strokeWidth={sel ? 3 : 2} />
            <path d="M0 -16 L4 -4 L16 2 L16 6 L4 4 L3 12 L7 16 L-7 16 L-3 12 L-4 4 L-16 6 L-16 2 L-4 -4Z" className={sel ? "fill-primary" : "fill-foreground/80"} />
            <text y="52" textAnchor="middle" className="fill-foreground font-mono" fontSize="12">{a.id}</text>
            <text y="66" textAnchor="middle" className="fill-muted-foreground font-mono" fontSize="10">{h}/100</text>
          </g>
        );
      })}
    </svg>
  );
}
