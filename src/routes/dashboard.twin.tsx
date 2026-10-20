import { createFileRoute, Link } from "@tanstack/react-router";
import { AIRCRAFT, COMPONENTS, getAircraft } from "@/lib/fleet/data";
import { componentHealth, deviation, healthBand } from "@/lib/fleet/engine";
import { useFleet } from "@/lib/fleet/store";
import { AircraftSchematic } from "@/components/aerion/AircraftSchematic";
import { Explain, HealthBar, Panel, SimBadge, btnGhost } from "@/components/aerion/ui";

export const Route = createFileRoute("/dashboard/twin")({
  head: () => ({ meta: [{ title: "Digital Twin — AERONYX" }, { name: "description", content: "Interactive aircraft digital twin with component health and sensor readings." }, { property: "og:title", content: "Digital Twin — AERONYX" }, { property: "og:description", content: "Every component. Every signal." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Twin,
});

const RECS: Record<string, Record<"critical" | "warning" | "success", string>> = {
  engine: { critical: "Ground for borescope and hot-section inspection; prepare turbine module kit.", warning: "Schedule borescope within 25 flight hours; trend EGT margin each sortie.", success: "Continue routine monitoring." },
  hydraulics: { critical: "Ground; perform pump performance test and leak isolation.", warning: "Inspect pump and lines at next turnaround; sample fluid.", success: "Continue routine monitoring." },
  avionics: { critical: "Ground; replace mission computer LRU and run full BIT.", warning: "Run extended BIT and check cooling airflow at next turnaround.", success: "Continue routine monitoring." },
  structure: { critical: "Ground; perform NDT of wing root and assess fatigue life.", warning: "Schedule NDT at next phased inspection; reduce high-g tasking.", success: "Continue routine monitoring." },
};

function Twin() {
  const f = useFleet();
  const a = getAircraft(f.selectedId);
  const c = f.selectedComponent;
  const h = componentHealth(a, c);
  const band = healthBand(h);
  const bands = Object.fromEntries(COMPONENTS.map((x) => [x.key, healthBand(componentHealth(a, x.key))]));
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="label-mono">Interactive Digital Twin</p><h1 className="mt-1 text-3xl font-bold">Every component. Every signal.</h1></div>
        <div className="flex items-center gap-2">
          <label htmlFor="ac" className="label-mono">Aircraft</label>
          <select id="ac" value={a.id} onChange={(e) => f.selectAircraft(e.target.value)} className="rounded-md border border-input bg-surface px-2 py-1.5 font-mono text-sm">
            {AIRCRAFT.map((x) => <option key={x.id} value={x.id}>{x.id} {x.callsign}</option>)}
          </select>
          <SimBadge />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Panel kicker="Click a system zone" title={`${a.id} · ${a.type}`}>
          <AircraftSchematic bands={bands} selected={c} onSelect={f.selectComponent} className="mx-auto max-h-[560px] w-full" />
        </Panel>
        <div className="space-y-4">
          <Panel kicker="Selected system" title={COMPONENTS.find((x) => x.key === c)!.label} right={<span className={`font-display text-3xl font-bold ${{ critical: "text-critical", warning: "text-warning", success: "text-success" }[band]}`}>{h}</span>}>
            <HealthBar value={h} />
            <div className="mt-4 space-y-3">
              {a.sensors[c].map((s) => {
                const d = deviation(s);
                return (
                  <div key={s.name} className="rounded-md border border-border bg-background/40 p-3">
                    <div className="flex items-baseline justify-between">
                      <span className="text-sm">{s.name}</span>
                      <span className="font-mono text-sm">{s.value}{s.unit && ` ${s.unit}`}</span>
                    </div>
                    <div className="mt-2 h-1 rounded-full bg-muted"><div className={`h-full rounded-full ${d >= 0.5 ? "bg-critical" : d >= 0.25 ? "bg-warning" : "bg-success"}`} style={{ width: `${Math.min(100, d * 100)}%` }} /></div>
                    <p className="mt-1 font-mono text-[11px] text-muted-foreground">nominal {s.baseline} · limit {s.limit} · {Math.round(d * 100)}% of band{d >= 0.5 && " · ANOMALY"}</p>
                  </div>
                );
              })}
            </div>
          </Panel>
          <Explain q="Recommended maintenance (requires approval)">
            <p>{RECS[c][band]}</p>
            <p className="text-xs">Rule: health &lt; 40 → ground; 40–59 → schedule; ≥ 60 → monitor. Health = 100 − 100 × (½·mean + ½·max of sensor band deviations).</p>
          </Explain>
          <Link to="/dashboard/simulator" onClick={() => f.setScenario({ aircraftId: a.id, component: c })} className={btnGhost}>Simulate failure of this system</Link>
        </div>
      </div>
    </div>
  );
}
