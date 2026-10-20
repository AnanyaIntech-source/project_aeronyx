import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AIRCRAFT, COMPONENTS, EXISTING_TASKS, SPARES, TECHNICIANS } from "@/lib/fleet/data";
import { aircraftHealth, componentHealth, weakestComponent } from "@/lib/fleet/engine";
import { useFleet } from "@/lib/fleet/store";
import { HealthBar, Metric, Panel, SimBadge, btnPrimary } from "@/components/aerion/ui";

export const Route = createFileRoute("/dashboard/")({
  head: () => ({ meta: [{ title: "Overview — AERONYX Fleet Command" }, { name: "description", content: "Fleet health, readiness and maintenance load at a glance." }, { property: "og:title", content: "Overview — AERONYX" }, { property: "og:description", content: "Fleet health and readiness overview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Overview,
});

function Overview() {
  const f = useFleet();
  const nav = useNavigate();
  const m = f.baseline.metrics;
  const flagged = AIRCRAFT.filter((a) => aircraftHealth(a) < 60).length;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-mono">Fleet Command · Overview</p>
          <h1 className="mt-1 text-3xl font-bold">The entire fleet. One intelligence layer.</h1>
        </div>
        <SimBadge />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Metric label="Fleet availability" value={`${m.availabilityNow}%`} sub={`${m.operationalNow}/${m.total} operational now`} tone="primary" />
        <Metric label="Flagged aircraft" value={flagged} sub="health < 60" tone="warning" />
        <Metric label="Open tasks" value={EXISTING_TASKS.length} sub={`${EXISTING_TASKS.filter((t) => t.grounding).length} grounding`} />
        <Metric label="Spare units" value={SPARES.reduce((p, s) => p + s.stock, 0)} sub={`${SPARES.length} part types`} />
        <Metric label="Technicians" value={TECHNICIANS.length} sub="8h shifts" />
      </div>

      <Panel kicker="Select an aircraft to begin" title="Fleet status" right={<Link to="/dashboard/simulator" className={btnPrimary}>Open simulator <ArrowRight className="h-3.5 w-3.5" /></Link>}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="label-mono text-left">
              <tr><th className="py-2">Aircraft</th><th>Type</th><th>Status</th><th className="w-40">Health</th>{COMPONENTS.map((c) => <th key={c.key} className="hidden lg:table-cell">{c.label}</th>)}<th>Watch item</th></tr>
            </thead>
            <tbody>
              {AIRCRAFT.map((a) => {
                const h = aircraftHealth(a);
                const grounded = m.aircraftAffected.includes(a.id);
                const sel = a.id === f.selectedId;
                return (
                  <tr key={a.id} onClick={() => { f.selectAircraft(a.id); nav({ to: "/dashboard/fleet" }); }}
                    className={`cursor-pointer border-t border-border transition hover:bg-primary/5 ${sel ? "bg-primary/10" : ""}`}>
                    <td className="py-3 font-mono"><span className="text-foreground">{a.id}</span> <span className="text-muted-foreground">{a.callsign}</span></td>
                    <td className="text-muted-foreground">{a.type}</td>
                    <td><span className={`font-mono text-xs ${grounded ? "text-warning" : "text-success"}`}>{grounded ? "IN MAINTENANCE" : "OPERATIONAL"}</span></td>
                    <td><div className="flex items-center gap-2"><span className="w-8 font-mono">{h}</span><HealthBar value={h} /></div></td>
                    {COMPONENTS.map((c) => <td key={c.key} className="hidden font-mono text-muted-foreground lg:table-cell">{componentHealth(a, c.key)}</td>)}
                    <td className="text-muted-foreground">{COMPONENTS.find((c) => c.key === weakestComponent(a))!.label}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Click a row to select it and open Fleet Intelligence.</p>
      </Panel>
    </div>
  );
}
