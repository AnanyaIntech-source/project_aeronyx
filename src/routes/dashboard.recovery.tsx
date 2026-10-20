import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "motion/react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CheckCircle2, ShieldAlert } from "lucide-react";
import { TECHNICIANS, getSpare } from "@/lib/fleet/data";
import { useFleet } from "@/lib/fleet/store";
import { Assumptions } from "@/components/aerion/Assumptions";
import { Explain, Metric, Panel, SimBadge, btnPrimary } from "@/components/aerion/ui";

export const Route = createFileRoute("/dashboard/recovery")({
  head: () => ({ meta: [{ title: "Self-Healing Fleet Engine — AERONYX" }, { name: "description", content: "Constraint-aware recovery plans: priorities, spares, technicians and projected availability." }, { property: "og:title", content: "Recovery Engine — AERONYX" }, { property: "og:description", content: "From disruption to intelligent recovery." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Recovery,
});

function Recovery() {
  const f = useFleet();
  const H = f.scenario.horizon;
  if (!f.simulated || !f.disrupted) {
    return (
      <div className="space-y-6">
        <Header />
        <div className="panel p-8 text-center">
          <ShieldAlert className="mx-auto h-8 w-8 text-warning" />
          <p className="mt-3 text-muted-foreground">Run a failure simulation first — the recovery engine plans against a disruption.</p>
          <Link to="/dashboard/simulator" className={btnPrimary + " mt-4"}>Go to simulator</Link>
        </div>
      </div>
    );
  }
  const b = f.baseline.metrics, d = f.disrupted.metrics, r = f.recovery;
  return (
    <div className="space-y-6">
      <Header />
      {!r ? (
        <Panel kicker={`Scenario · ${f.scenario.aircraftId} ${f.scenario.component} · ${f.scenario.severity} · ${H}h`} title="Disruption ready for re-planning">
          <p className="mb-4 text-sm text-muted-foreground">Disrupted projection: {d.availabilityAtH}% availability at T+{H}h, backlog {d.backlog}, full recovery T+{d.recoveryH}h.</p>
          <button className={btnPrimary + " glow"} onClick={f.generatePlan}><Activity className="h-4 w-4" /> Generate recovery plan</button>
        </Panel>
      ) : (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Panel kicker="Baseline → Disrupted → Proposed recovery" title="Projected improvement">
            <div className="grid gap-3 md:grid-cols-3">
              {[{ m: b, t: "text-success" }, { m: d, t: "text-critical" }, { m: r.metrics, t: "text-primary" }].map(({ m, t }) => (
                <div key={m.label} className="rounded-md border border-border p-4">
                  <p className={`font-display font-semibold ${t}`}>{m.label.toUpperCase()}</p>
                  <p className="mb-3 text-[11px] text-muted-foreground">{m.timeLabel}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Metric label={`Avail. T+${H}h`} value={`${m.availabilityAtH}%`} />
                    <Metric label="Operational" value={`${m.operationalAtH}/${m.total}`} />
                    <Metric label="Backlog" value={m.backlog} />
                    <Metric label="Recovery" value={m.recoveryH ? `T+${m.recoveryH}h` : "—"} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 h-64">
              <ResponsiveContainer>
                <BarChart data={[
                  { k: `Availability at T+${H}h (%)`, Baseline: b.availabilityAtH, Disrupted: d.availabilityAtH, Recovery: r.metrics.availabilityAtH },
                  { k: "Full recovery (h)", Baseline: b.recoveryH, Disrupted: d.recoveryH, Recovery: r.metrics.recoveryH },
                  { k: "Downtime in horizon (h)", Baseline: b.downtimeH, Disrupted: d.downtimeH, Recovery: r.metrics.downtimeH },
                ]}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="k" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                  <Legend />
                  <Bar dataKey="Baseline" fill="var(--success)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Disrupted" fill="var(--critical)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="Recovery" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>

          <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
            <Panel kicker="1 · 2 · 3" title="Prioritized actions, spares & technicians">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="label-mono text-left"><tr><th className="py-2">#</th><th>Aircraft</th><th>Action</th><th>Spare</th><th>Technician(s)</th><th>Window</th></tr></thead>
                  <tbody>
                    {r.order.map((s, i) => (
                      <tr key={s.task.id} className="border-t border-border align-top">
                        <td className="py-2 font-mono text-muted-foreground">{i + 1}</td>
                        <td className="font-mono">{s.task.aircraftId}</td>
                        <td>{s.task.label}{s.task.grounding && <span className="ml-1 font-mono text-[10px] text-warning">GROUNDING</span>}</td>
                        <td className="text-xs text-muted-foreground">{s.spare ? `${s.spare.fromStock + s.spare.ordered}× ${getSpare(s.spare.spareId).name}${s.spare.ordered ? ` (${s.spare.ordered} on order)` : ""}` : "—"}</td>
                        <td className="text-xs">{[...new Set(s.assignments.map((a) => TECHNICIANS.find((t) => t.id === a.techId)!.name))].join(", ")}</td>
                        <td className={`font-mono text-xs ${s.end > H ? "text-warning" : "text-muted-foreground"}`}>T+{Math.round(s.start)}–{Math.round(s.end)}h</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
            <div className="space-y-4">
              <Panel kicker="4" title="Recovery timeline">
                <Gantt segments={r.segments} H={Math.max(H, ...r.segments.map((s) => s.end))} horizon={H} />
              </Panel>
              <Panel kicker="5 · 6" title="Substitution & projection">
                {r.substitutions.length ? r.substitutions.map((s) => <p key={s.grounded} className="mb-2 text-sm text-muted-foreground">• {s.reason}</p>) : <p className="text-sm text-muted-foreground">No substitution needed — every aircraft is projected back within T+{H}h, or no eligible standby exists.</p>}
                <p className="mt-2 text-sm">Projected availability at T+{H}h: <b className="text-primary">{r.metrics.availabilityAtH}%</b> (vs {d.availabilityAtH}% without re-planning).</p>
              </Panel>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Explain q="Why were these actions prioritized?">{r.rationale.map((x) => <p key={x}>• {x}</p>)}</Explain>
            <Explain q="How does the plan improve availability?">
              <p>Same tasks, technicians and spares as the disrupted projection — only the order and crew assignment change.</p>
              <p>Availability at T+{H}h: {d.availabilityAtH}% → {r.metrics.availabilityAtH}%. Full recovery: T+{d.recoveryH}h → T+{r.metrics.recoveryH}h.</p>
            </Explain>
            <Explain q="Constraints preventing full recovery">
              {r.constraints.length ? r.constraints.map((x) => <p key={x}>• {x}</p>) : <p>None within this horizon.</p>}
            </Explain>
          </div>
          <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning">
            <CheckCircle2 className="h-4 w-4 shrink-0" /> Recommendation only. Every action and every return-to-service requires approval by qualified maintenance personnel.
          </div>
        </motion.div>
      )}
      <Assumptions />
    </div>
  );
}

function Header() {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><p className="label-mono">Self-Healing Fleet Engine</p><h1 className="mt-1 text-3xl font-bold">From disruption to intelligent recovery.</h1></div>
      <SimBadge />
    </div>
  );
}

function Gantt({ segments, H, horizon }: { segments: { techId: string; start: number; end: number; aircraftId: string; label: string }[]; H: number; horizon: number }) {
  const max = Math.ceil(H / 12) * 12;
  return (
    <div className="space-y-2">
      {TECHNICIANS.map((t) => (
        <div key={t.id} className="flex items-center gap-2">
          <span className="w-16 shrink-0 font-mono text-[10px] text-muted-foreground">{t.id} {t.skills[0].slice(0, 4)}</span>
          <div className="relative h-5 flex-1 rounded bg-muted/50">
            <div className="absolute inset-y-0 border-r border-dashed border-warning" style={{ left: `${(horizon / max) * 100}%` }} />
            {segments.filter((s) => s.techId === t.id).map((s, i) => (
              <motion.div key={i} title={`${s.aircraftId}: ${s.label} T+${Math.round(s.start)}–${Math.round(s.end)}h`}
                initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ delay: i * 0.05 }}
                className="absolute inset-y-0.5 origin-left rounded-sm bg-primary/70" style={{ left: `${(s.start / max) * 100}%`, width: `${((s.end - s.start) / max) * 100}%` }} />
            ))}
          </div>
        </div>
      ))}
      <p className="font-mono text-[10px] text-muted-foreground">0h → {max}h · dashed line = horizon T+{horizon}h · technicians never overlap tasks</p>
    </div>
  );
}
