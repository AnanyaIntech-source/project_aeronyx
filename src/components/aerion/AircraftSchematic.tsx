import type { ComponentKey } from "@/lib/fleet/data";

type Band = "success" | "warning" | "critical";
const fill: Record<Band, string> = {
  success: "fill-success/15 stroke-success",
  warning: "fill-warning/20 stroke-warning",
  critical: "fill-critical/25 stroke-critical",
};

interface Props {
  bands?: Partial<Record<ComponentKey, Band>>;
  selected?: ComponentKey | null;
  onSelect?: (c: ComponentKey) => void;
  className?: string;
}

/** Top-down technical schematic of a fictional twin-engine jet with clickable system zones. */
export function AircraftSchematic({ bands = {}, selected, onSelect, className }: Props) {
  const interactive = !!onSelect;
  const zone = (c: ComponentKey) => {
    const b = bands[c] ?? "success";
    const sel = selected === c;
    return {
      className: `${fill[b]} transition-all duration-300 ${interactive ? "cursor-pointer hover:brightness-150" : ""} ${sel ? "stroke-[2.5]" : "stroke-1"}`,
      ...(interactive
        ? { role: "button", tabIndex: 0, "aria-label": `Select ${c}`, "aria-pressed": sel, onClick: () => onSelect!(c), onKeyDown: (e: React.KeyboardEvent) => (e.key === "Enter" || e.key === " ") && onSelect!(c) }
        : {}),
    };
  };
  return (
    <svg viewBox="0 0 400 520" className={className} aria-label="Aircraft digital twin schematic">
      <defs>
        <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" className="fill-none stroke-primary/10" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="400" height="520" fill="url(#grid)" />
      {/* fuselage outline */}
      <path d="M200 20 C215 60 222 110 224 170 L226 380 L232 470 L200 500 L168 470 L174 380 L176 170 C178 110 185 60 200 20Z" className="fill-elevated/40 stroke-primary/60" strokeWidth="1.2" />
      {/* structural: wings + tail */}
      <g {...zone("structure")}>
        <path d="M176 210 L30 330 L30 352 L176 300Z" />
        <path d="M224 210 L370 330 L370 352 L224 300Z" />
        <path d="M174 430 L110 480 L110 494 L174 470Z" />
        <path d="M226 430 L290 480 L290 494 L226 470Z" />
      </g>
      {/* avionics: nose bay */}
      <path {...zone("avionics")} d="M200 40 C210 70 214 100 215 140 L185 140 C186 100 190 70 200 40Z" />
      {/* hydraulics: central bay + lines */}
      <g {...zone("hydraulics")}>
        <rect x="186" y="230" width="28" height="90" rx="4" />
      </g>
      <g className="stroke-primary/40 flow-line" fill="none" strokeWidth="1">
        <path d="M186 260 L90 320" /><path d="M214 260 L310 320" />
      </g>
      {/* engines */}
      <g {...zone("engine")}>
        <rect x="178" y="340" width="20" height="110" rx="8" />
        <rect x="202" y="340" width="20" height="110" rx="8" />
      </g>
      {/* callouts */}
      <g className="fill-muted-foreground font-mono" fontSize="10" letterSpacing="1.5">
        <text x="232" y="92">AVIONICS</text>
        <text x="40" y="320">STRUCTURE</text>
        <text x="232" y="276">HYDRAULICS</text>
        <text x="240" y="400">ENGINES</text>
      </g>
      <g className="stroke-muted-foreground/40" strokeWidth="0.6">
        <path d="M215 90 L230 90" /><path d="M214 272 L230 272" /><path d="M222 396 L238 396" />
      </g>
    </svg>
  );
}
