import twinAircraft from "@/assets/twin-aircraft.jpg.asset.json";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { COMPONENTS, type Aircraft, type ComponentKey } from "@/lib/fleet/data";
import { componentHealth, healthBand } from "@/lib/fleet/engine";

/** Coordinates are relative to the unchanged square reference, not its outer column. */
export function DigitalTwinAircraft({ aircraft, selected, onSelect }: {
  aircraft: Aircraft;
  selected: ComponentKey;
  onSelect: (component: ComponentKey) => void;
}) {
  return <div className="home-twin-stage">
    <div className="home-twin-image" role="group" aria-label="Aircraft component hotspots">
      <img src={twinAircraft.url} alt="Detailed top-down cyan-blue fighter aircraft wireframe on a dark navy background" width="768" height="768" loading="lazy" />
      <TooltipProvider delayDuration={180}>{COMPONENTS.map(({ key, label }) => <Tooltip key={key}><TooltipTrigger asChild><Button
        key={key}
        type="button"
        variant="ghost"
        className={`home-twin-hotspot home-twin-hotspot-${key} home-twin-status-${healthBand(componentHealth(aircraft, key))}`}
        aria-label={`Select ${label} on aircraft`}
        aria-pressed={selected === key}
        aria-controls="home-twin-readings"
        onClick={() => onSelect(key)}
      ><span className="home-twin-dot" aria-hidden="true" /><span className="sr-only">{label}</span></Button></TooltipTrigger><TooltipContent className="rounded-sm border border-border bg-surface px-2 py-1 font-mono text-[10px] text-foreground shadow-none" sideOffset={2}>{label}</TooltipContent></Tooltip>)}</TooltipProvider>
    </div>
  </div>;
}