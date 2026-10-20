import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, ArrowRight, Boxes, Gauge, Plane, RotateCcw, Users, Wrench, Zap } from "lucide-react";
import { AIRCRAFT, COMPONENTS, SPARES, getSpare } from "@/lib/fleet/data";
import { SEVERITY_RULES, similarAircraft, type Horizon, type Severity } from "@/lib/fleet/engine";
import { useFleet } from "@/lib/fleet/store";
import { Assumptions } from "@/components/aerion/Assumptions";
import { Metric, Panel, SimBadge, btnGhost, btnPrimary } from "@/components/aerion/ui";

export const Route = createFileRoute("/dashboard/simulator")({
  head: () => ({ meta: [{ title: "Failure Domino Simulator — AERONYX" }, { name: "description", content: "Simulate one aircraft failure and watch the consequences spread across the fleet." }, { property: "og:title", content: "Failure Domino Simulator — AERONYX" }, { property: "og:description", content: "One failure. Multiple consequences." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Simulator,
});

const sel = "w-full rounded-md border border-input bg-surface px-3 py-2 font-mono text-sm";

function Simulator() {
  const f = useFleet();
  const sc = f.scenario;
  const b = f.baseline.metrics;
  const d = f.disrupted?.metrics;
  const fault = f.disrupted?.res.scheduled.find((s) => s.task.id === "F-1");
  const cascade = f.disrupted?.res.scheduled.filter((s) => s.task.origin === "cascade") ?? [];

  const chain = d && fault ? [
    { icon: Zap, title: "Aircraft fault", body: `${sc.aircraftId} ${COMPONENTS.find((c) => c.key === sc.component)!.label.toLowerCase()} — ${SEVERITY_RULES[sc.severity].label.toLowerCase()}`, tone: "critical" },
    { icon: Plane, title: "Aircraft unavailable", body: `${d.aircraftAffected.length} grounded now (${d.aircraftAffected.join(", ")})${cascade.some((c) => c.task.grounding) ? " incl. shared-signature checks" : ""}`, tone: "critical" },
    { icon: Boxes, title: "Spare requirement", body: `${fault.spare!.fromStock + fault.spare!.ordered}× ${getSpare(fault.spare!.spareId).name}: ${fault.spare!.fromStock} from stock${fault.spare!.ordered ? `, ${fault.spare!.ordered} ordered (+${fault.spare!.readyAt}h)` : ""}`, tone: fault.spare!.ordered ? "critical" : "warning" },
    { icon: Users, title: "Technician pressure", body: `Utilization ${b.techUtilization}% → ${d.techUtilization}% over ${sc.horizon}h`, tone: "warning" },
    { icon: Wrench, title: "Maintenance backlog", body: `${b.backlog} → ${d.backlog} tasks beyond T+${sc.horizon}h`, tone: d.backlog > b.backlog ? "critical" : "warning" },
    { icon: Gauge, title: "Fleet availability", body: `${b.availabilityNow}% → ${d.availabilityNow}% now · ${d.availabilityAtH}% at T+${sc.horizon}h`, tone: "critical" },
  ] : [];
  const toneCls: Record<string, string> = { critical: "border-critical/50 text-critical", warning: "border-warning/50 text-warning" };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="label-mono">Failure Domino Simulator</p><h1 className="mt-1 text-3xl font-bold">One failure. Multiple consequences.</h1></div>
        <SimBadge />
      </div>

      <Panel kicker="Scenario" title="Configure the disruption">
        <div className="grid gap-4 md:grid-cols-4">
          <label className="space-y-1"><span className="label-mono">Aircraft</span>
            <select className={sel} value={sc.aircraftId} onChange={(e) => f.setScenario({ aircraftId: e.target.value })}>
              {AIRCRAFT.map((a) => <option key={a.id} value={a.id}>{a.id} {a.callsign} · {a.type}</option>)}
            </select></label>
          <label className="space-y-1"><span className="label-mono">Component failure</span>
            <select className={sel} value={sc.component} onChange={(e) => f.setScenario({ component: e.target.value as typeof sc.component })}>
              {COMPONENTS.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select></label>
          <label className="space-y-1"><span className="label-mono">Severity</span>
            <select className={sel} value={sc.severity} onChange={(e) => f.setScenario({ severity: e.target.value as Severity })}>
              {(Object.keys(SEVERITY_RULES) as Severity[]).map((s) => <option key={s} value={s}>{SEVERITY_RULES[s].label}</option>)}
            </select></label>
          <label className="space-y-1"><span className="label-mono">Simulation horizon</span>
            <select className={sel} value={sc.horizon} onChange={(e) => f.setScenario({ horizon: Number(e.target.value) as Horizon })}>
              {[24, 48, 72].map((h) => <option key={h} value={h}>{h} hours</option>)}
            </select></label>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{SEVERITY_RULES[sc.severity].description} Shared-signature aircraft for this fault: {similarAircraft(sc.aircraftId, sc.component).map((m) => m.aircraft.id).join(", ") || "none"}.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button className={btnPrimary + " glow"} onClick={f.simulate}><Zap className="h-4 w-4" /> Simulate failure</button>
          <button className={btnGhost} onClick={f.replay} disabled={!f.simulated}>Replay</button>
          <button className={btnGhost} onClick={f.reset}><RotateCcw className="h-3.5 w-3.5" /> Reset</button>
        </div>
      </Panel>

      {!d && (
        <div className="panel flex items-center gap-3 p-6 text-muted-foreground"><AlertTriangle className="h-5 w-5 text-warning" />Configure a scenario and press <b className="text-foreground">Simulate failure</b> to watch the consequences cascade.</div>
      )}

      {d && (
        <>
          <Panel kicker="Cascade" title="Watch the consequences spread">
            <div key={f.runId} className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
              <AnimatePresence>
                {chain.map((c, i) => (
                  <motion.div key={c.title} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: i * 0.45, duration: 0.5 }}
                    className={`relative rounded-md border bg-background/50 p-4 ${toneCls[c.tone]}`}>
                    <c.icon className="h-5 w-5" />
                    <p className="mt-2 font-display text-sm font-semibold text-foreground">{i + 1}. {c.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{c.body}</p>
                    {i < chain.length - 1 && <ArrowRight className="absolute -right-3 top-1/2 hidden h-4 w-4 -translate-y-1/2 text-muted-foreground xl:block" />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </Panel>

          <motion.div key={"cmp" + f.runId} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: chain.length * 0.45 }}>
            <Panel kicker={`Baseline vs disrupted · horizon ${sc.horizon}h`} title="Fleet impact"
              right={<Link to="/dashboard/recovery" className={btnPrimary}>Generate recovery plan <ArrowRight className="h-3.5 w-3.5" /></Link>}>
              <div className="grid gap-4 lg:grid-cols-2">
                {[b, d].map((m, i) => (
                  <div key={m.label} className={`rounded-md border p-4 ${i ? "border-critical/40" : "border-border"}`}>
                    <p className={`font-display font-semibold ${i ? "text-critical" : "text-success"}`}>{m.label.toUpperCase()}</p>
                    <p className="label-mono mb-3 normal-case tracking-normal">{m.timeLabel}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      <Metric label="Affected" value={m.aircraftAffected.length} />
                      <Metric label="Available" value={`${m.operationalNow}/${m.total}`} />
                      <Metric label="Avail. now" value={`${m.availabilityNow}%`} tone={i ? "critical" : "success"} />
                      <Metric label={`Avail. T+${sc.horizon}h`} value={`${m.availabilityAtH}%`} />
                      <Metric label="Spares left" value={m.spareStock} sub={m.sparesOrdered ? `${m.sparesOrdered} ordered` : `of ${SPARES.reduce((p, s) => p + s.stock, 0)}`} />
                      <Metric label="Tech util." value={`${m.techUtilization}%`} />
                      <Metric label="Backlog" value={m.backlog} sub="tasks" />
                      <Metric label="Downtime" value={`${m.downtimeH}h`} sub={`recovery T+${m.recoveryH}h`} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Disrupted projection keeps the existing maintenance board order (first come, first served) with no re-planning. Baseline data is never modified.</p>
            </Panel>
          </motion.div>
        </>
      )}
      <Assumptions />
    </div>
  );
}
