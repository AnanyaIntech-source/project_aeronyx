import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { COMPONENTS, getAircraft } from "@/lib/fleet/data";
import { aircraftHealth, componentHealth, deviation, flagReasons, similarAircraft, SIMILARITY_THRESHOLD, SIGNIFICANT_DEVIATION } from "@/lib/fleet/engine";
import { useFleet } from "@/lib/fleet/store";
import { FleetNetwork } from "@/components/aerion/FleetNetwork";
import { Explain, HealthBar, Panel, SimBadge, btnGhost } from "@/components/aerion/ui";

export const Route = createFileRoute("/dashboard/fleet")({
  head: () => ({ meta: [{ title: "Fleet Intelligence — AERONYX" }, { name: "description", content: "Collective fleet intelligence: find aircraft sharing a fault signature." }, { property: "og:title", content: "Fleet Intelligence — AERONYX" }, { property: "og:description", content: "Shared fault signatures across the fleet." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Fleet,
});

function Fleet() {
  const f = useFleet();
  const a = getAircraft(f.selectedId);
  const matches = similarAircraft(a.id, f.selectedComponent);
  const reasons = flagReasons(a);
  const compLabel = COMPONENTS.find((c) => c.key === f.selectedComponent)!.label;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="label-mono">Collective Fleet Intelligence</p><h1 className="mt-1 text-3xl font-bold">One fleet. Shared intelligence.</h1></div>
        <SimBadge />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Panel kicker="Click an aircraft node" title="Fleet signature network">
          <div className="mb-3 flex flex-wrap gap-2">
            {COMPONENTS.map((c) => (
              <button key={c.key} onClick={() => f.selectComponent(c.key)} aria-pressed={f.selectedComponent === c.key}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition ${f.selectedComponent === c.key ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>
                {c.label}
              </button>
            ))}
          </div>
          <FleetNetwork selectedId={a.id} component={f.selectedComponent} onSelect={f.selectAircraft} className="w-full" />
          <p className="mt-2 text-xs text-muted-foreground"><span className="text-warning">Amber links</span> = same {compLabel.toLowerCase()} fault signature as {a.id}.</p>
        </Panel>
        <div className="space-y-4">
          <Panel kicker={`${a.type} · ${a.base} · P${a.missionPriority}`} title={`${a.id} ${a.callsign}`} right={<span className="font-display text-3xl font-bold">{aircraftHealth(a)}</span>}>
            <div className="space-y-3">
              {COMPONENTS.map((c) => {
                const h = componentHealth(a, c.key);
                return (
                  <button key={c.key} onClick={() => f.selectComponent(c.key)} className={`w-full rounded-md p-2 text-left transition hover:bg-primary/5 ${f.selectedComponent === c.key ? "bg-primary/10" : ""}`}>
                    <div className="mb-1 flex justify-between text-sm"><span>{c.label}</span><span className="font-mono">{h}</span></div>
                    <HealthBar value={h} />
                  </button>
                );
              })}
            </div>
          </Panel>
          <Explain q="Why was this aircraft flagged?">
            {reasons.length ? reasons.slice(0, 4).map((r) => <p key={r}>• {r}</p>) : <p>No sensor is past 50% of its alert band and every system is above 60 health. Not flagged.</p>}
          </Explain>
          <Explain q={`Why are other aircraft similar (${compLabel})?`}>
            {matches.length ? (
              matches.map((m) => (
                <p key={m.aircraft.id}>• <span className="text-foreground">{m.aircraft.id}</span>: signature similarity {m.similarity.toFixed(2)} (cosine of normalized sensor deviations). Shared elevated indicators: {m.sharedSensors.join(", ") || "pattern shape"}.</p>
              ))
            ) : (
              <p>No aircraft matches. A match needs cosine similarity ≥ {SIMILARITY_THRESHOLD} AND at least one sensor ≥ {SIGNIFICANT_DEVIATION * 100}% into its alert band, on both aircraft.</p>
            )}
            <p className="pt-1 text-xs">Current {compLabel.toLowerCase()} deviations for {a.id}: {a.sensors[f.selectedComponent].map((s) => `${s.name} ${Math.round(deviation(s) * 100)}%`).join(" · ")}</p>
          </Explain>
          <div className="flex gap-2">
            <Link to="/dashboard/twin" className={btnGhost}>Inspect twin</Link>
            <Link to="/dashboard/simulator" onClick={() => f.setScenario({ aircraftId: a.id, component: f.selectedComponent })} className={btnGhost}>Simulate this fault <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
