// AERION deterministic rules engine. Pure functions only — never mutates baseline data.
// Designed so a future prediction service (e.g. Python/FastAPI) can replace
// `componentHealth` / `similarAircraft` while keeping the same interfaces.
import {
  AIRCRAFT, EXISTING_TASKS, SPARES, TECHNICIANS, COMPONENTS,
  type Aircraft, type ComponentKey, type Sensor, type Task, type Technician, type Skill,
} from "./data";

export type Severity = "minor" | "major" | "critical";
export type Horizon = 24 | 48 | 72;

export const SEVERITY_RULES: Record<Severity, { label: string; repairH: number; spareQty: number; inspectH: number; cascade: "none" | "inspect" | "ground"; description: string }> = {
  minor: { label: "Minor", repairH: 6, spareQty: 1, inspectH: 2, cascade: "none", description: "Aircraft grounded for a 6h repair (1 spare) + 2h inspection. No fleet cascade." },
  major: { label: "Major", repairH: 14, spareQty: 1, inspectH: 3, cascade: "inspect", description: "14h repair (1 spare) + 3h inspection. Similar-signature aircraft receive a 3h precautionary check (stay operational)." },
  critical: { label: "Critical", repairH: 28, spareQty: 2, inspectH: 4, cascade: "ground", description: "28h repair (2 spares) + 4h inspection. Similar-signature aircraft are grounded until a 4h precautionary check is complete." },
};

export const SHIFT_HOURS = 8;
export const SIMILARITY_THRESHOLD = 0.9;
export const SIGNIFICANT_DEVIATION = 0.35;

// ---------- Health ----------
export const deviation = (x: Sensor) => Math.min(1.2, Math.max(0, (x.value - x.baseline) / (x.limit - x.baseline)));
export const signature = (a: Aircraft, c: ComponentKey) => a.sensors[c].map(deviation);

export function componentHealth(a: Aircraft, c: ComponentKey) {
  const d = signature(a, c);
  const mean = d.reduce((p, v) => p + v, 0) / d.length;
  const max = Math.max(...d);
  return Math.round(Math.max(0, Math.min(100, 100 - 100 * (0.5 * mean + 0.5 * max))));
}
export function aircraftHealth(a: Aircraft) {
  const hs = COMPONENTS.map((c) => componentHealth(a, c.key));
  const mean = hs.reduce((p, v) => p + v, 0) / hs.length;
  return Math.round(0.4 * mean + 0.6 * Math.min(...hs));
}
export const healthBand = (h: number) => (h < 40 ? "critical" : h < 60 ? "warning" : "success") as "critical" | "warning" | "success";
export function weakestComponent(a: Aircraft): ComponentKey {
  return [...COMPONENTS].sort((x, y) => componentHealth(a, x.key) - componentHealth(a, y.key))[0].key;
}

// ---------- Collective fleet intelligence ----------
const cosine = (a: number[], b: number[]) => {
  const dot = a.reduce((p, v, i) => p + v * b[i], 0);
  const na = Math.hypot(...a), nb = Math.hypot(...b);
  return na === 0 || nb === 0 ? 0 : dot / (na * nb);
};
export interface SimilarMatch { aircraft: Aircraft; similarity: number; sharedSensors: string[] }
/** Aircraft whose same-component signature points in the same direction (cosine ≥ threshold) AND is significantly deviated. */
export function similarAircraft(id: string, c: ComponentKey): SimilarMatch[] {
  const src = AIRCRAFT.find((a) => a.id === id)!;
  const sv = signature(src, c);
  return AIRCRAFT.filter((a) => a.id !== id)
    .map((a) => {
      const v = signature(a, c);
      return {
        aircraft: a,
        similarity: cosine(sv, v),
        maxDev: Math.max(...v),
        sharedSensors: a.sensors[c].filter((_, i) => v[i] >= 0.25 && sv[i] >= 0.25).map((x) => x.name),
      };
    })
    .filter((m) => m.similarity >= SIMILARITY_THRESHOLD && m.maxDev >= SIGNIFICANT_DEVIATION && Math.max(...sv) >= SIGNIFICANT_DEVIATION)
    .sort((x, y) => y.similarity - x.similarity)
    .map(({ aircraft, similarity, sharedSensors }) => ({ aircraft, similarity, sharedSensors }));
}

export function flagReasons(a: Aircraft): string[] {
  const out: string[] = [];
  for (const c of COMPONENTS) {
    const h = componentHealth(a, c.key);
    a.sensors[c.key].forEach((x) => {
      const d = deviation(x);
      if (d >= 0.5) out.push(`${c.label}: ${x.name} at ${x.value}${x.unit} is ${Math.round(d * 100)}% of the way from nominal (${x.baseline}) to its alert limit (${x.limit}).`);
    });
    if (h < 60 && !out.some((o) => o.startsWith(c.label))) out.push(`${c.label} health ${h}/100 is below the 60 watch threshold.`);
  }
  return out;
}

export function sensorHistory(x: Sensor, points = 14) {
  return Array.from({ length: points }, (_, i) => {
    const t = i / (points - 1);
    const v = x.baseline + (x.value - x.baseline) * Math.pow(t, 1.6) + (x.limit - x.baseline) * 0.015 * Math.sin(i * 1.7);
    return { day: `D-${points - 1 - i}`, value: Math.round(v * 100) / 100, limit: x.limit };
  });
}

// ---------- Scheduler ----------
export interface Assignment { taskId: string; techId: string; start: number; end: number; hours: number }
export interface SpareAllocation { taskId: string; spareId: string; fromStock: number; ordered: number; readyAt: number }
export interface ScheduledTask { task: Task; start: number; end: number; assignments: Assignment[]; spare?: SpareAllocation }

/** Work `hours` on a technician's daily 8h shift windows starting no earlier than `from`. Returns segments. */
function workSegments(t: Technician, from: number, hours: number) {
  const segs: { start: number; end: number }[] = [];
  let remaining = hours;
  for (let d = 0; remaining > 1e-9 && d < 60; d++) {
    const ws = d * 24 + t.shiftStartH, we = ws + SHIFT_HOURS;
    const s = Math.max(ws, from);
    if (s >= we) continue;
    const e = Math.min(we, s + remaining);
    segs.push({ start: s, end: e });
    remaining -= e - s;
  }
  return segs;
}

interface ScheduleOpts { crewSplit: boolean }
export function schedule(tasks: Task[], opts: ScheduleOpts = { crewSplit: false }) {
  const freeAt: Record<string, number> = Object.fromEntries(TECHNICIANS.map((t) => [t.id, 0]));
  const stock: Record<string, number> = Object.fromEntries(SPARES.map((p) => [p.id, p.stock]));
  const done: Record<string, number> = {};
  const out: ScheduledTask[] = [];
  const segments: (Assignment & { label: string; aircraftId: string })[] = [];

  for (const task of tasks) {
    let ready = task.dependsOn ? done[task.dependsOn] ?? 0 : 0;
    let spare: SpareAllocation | undefined;
    if (task.spareId && task.spareQty) {
      const p = SPARES.find((x) => x.id === task.spareId)!;
      const fromStock = Math.min(stock[p.id], task.spareQty); // never negative
      const ordered = task.spareQty - fromStock;
      stock[p.id] -= fromStock;
      spare = { taskId: task.id, spareId: p.id, fromStock, ordered, readyAt: ordered > 0 ? p.leadTimeH : 0 };
      ready = Math.max(ready, spare.readyAt);
    }
    const qualified = TECHNICIANS.filter((t) => t.skills.includes(task.skill as Skill));
    const plan = (t: Technician, h: number) => workSegments(t, Math.max(freeAt[t.id], ready), h);
    const endOf = (segs: { end: number }[]) => (segs.length ? segs[segs.length - 1].end : ready);

    let chosen: { tech: Technician; segs: { start: number; end: number }[]; hours: number }[] = [];
    const single = qualified
      .map((t) => ({ tech: t, segs: plan(t, task.hours), hours: task.hours }))
      .sort((a, b) => endOf(a.segs) - endOf(b.segs) || a.tech.id.localeCompare(b.tech.id))[0];
    chosen = [single];
    if (opts.crewSplit && task.grounding && task.hours >= 12 && qualified.length >= 2) {
      const half = task.hours / 2;
      const pair = qualified
        .map((t) => ({ tech: t, segs: plan(t, half), hours: half }))
        .sort((a, b) => endOf(a.segs) - endOf(b.segs) || a.tech.id.localeCompare(b.tech.id))
        .slice(0, 2);
      if (Math.max(...pair.map((p) => endOf(p.segs))) < endOf(single.segs)) chosen = pair;
    }
    const assignments: Assignment[] = [];
    for (const c of chosen) {
      freeAt[c.tech.id] = endOf(c.segs);
      for (const sg of c.segs) {
        const a = { taskId: task.id, techId: c.tech.id, start: sg.start, end: sg.end, hours: sg.end - sg.start };
        assignments.push(a);
        segments.push({ ...a, label: task.label, aircraftId: task.aircraftId });
      }
    }
    const start = Math.min(...assignments.map((a) => a.start));
    const end = Math.max(...assignments.map((a) => a.end));
    done[task.id] = end;
    out.push({ task, start, end, assignments, spare });
  }
  return { scheduled: out, segments, stockAfter: stock };
}

// ---------- Scenario ----------
export interface Scenario { aircraftId: string; component: ComponentKey; severity: Severity; horizon: Horizon }

export function faultTasks(sc: Scenario): Task[] {
  const a = AIRCRAFT.find((x) => x.id === sc.aircraftId)!;
  const rule = SEVERITY_RULES[sc.severity];
  const spare = SPARES.find((p) => p.component === sc.component && p.compatible.includes(a.type))!;
  const label = COMPONENTS.find((c) => c.key === sc.component)!.label;
  const tasks: Task[] = [
    { id: "F-1", aircraftId: a.id, label: `${label} fault repair (${rule.label.toLowerCase()})`, skill: sc.component, hours: rule.repairH, spareId: spare.id, spareQty: rule.spareQty, grounding: true, origin: "fault" },
    { id: "F-2", aircraftId: a.id, label: "Return-to-service inspection", skill: "inspection", hours: rule.inspectH, grounding: true, dependsOn: "F-1", origin: "fault" },
  ];
  if (rule.cascade !== "none") {
    similarAircraft(a.id, sc.component).forEach((m, i) =>
      tasks.push({
        id: `C-${i + 1}`, aircraftId: m.aircraft.id, label: `Precautionary ${label.toLowerCase()} check (shared signature)`,
        skill: sc.component, hours: rule.cascade === "ground" ? 4 : 3, grounding: rule.cascade === "ground", origin: "cascade",
      }),
    );
  }
  return tasks;
}

export interface StateMetrics {
  label: string;
  timeLabel: string;
  operationalNow: number;
  operationalAtH: number;
  total: number;
  availabilityNow: number;
  availabilityAtH: number;
  aircraftAffected: string[];
  spareStock: number;
  sparesOrdered: number;
  techUtilization: number;
  backlog: number;
  downtimeH: number;
  recoveryH: number; // hours until every grounded aircraft is back (0 if none)
  returnTimes: Record<string, number>;
}

export const availability = (op: number, total: number) => Math.round((op / total) * 1000) / 10;

function measure(label: string, timeLabel: string, tasks: Task[], res: ReturnType<typeof schedule>, H: number): StateMetrics {
  const total = AIRCRAFT.length;
  const returnTimes: Record<string, number> = {};
  for (const st of res.scheduled) if (st.task.grounding) returnTimes[st.task.aircraftId] = Math.max(returnTimes[st.task.aircraftId] ?? 0, st.end);
  const grounded = Object.keys(returnTimes);
  const opAtH = total - grounded.filter((id) => returnTimes[id] > H).length;
  const worked = res.segments.reduce((p, s) => p + Math.max(0, Math.min(s.end, H) - Math.min(s.start, H)), 0);
  const capacity = TECHNICIANS.length * SHIFT_HOURS * (H / 24);
  return {
    label, timeLabel, total,
    operationalNow: total - grounded.length,
    operationalAtH: opAtH,
    availabilityNow: availability(total - grounded.length, total),
    availabilityAtH: availability(opAtH, total),
    aircraftAffected: grounded,
    spareStock: Object.values(res.stockAfter).reduce((p, v) => p + v, 0),
    sparesOrdered: res.scheduled.reduce((p, s) => p + (s.spare?.ordered ?? 0), 0),
    techUtilization: Math.round((worked / capacity) * 100),
    backlog: res.scheduled.filter((s) => s.end > H).length,
    downtimeH: Math.round(grounded.reduce((p, id) => p + Math.min(returnTimes[id], H), 0)),
    recoveryH: grounded.length ? Math.round(Math.max(...grounded.map((id) => returnTimes[id]))) : 0,
    returnTimes,
  };
}

export function runBaseline(H: Horizon) {
  const tasks = [...EXISTING_TASKS];
  const res = schedule(tasks);
  return { tasks, res, metrics: measure("Baseline", `Before fault · projected to T+${H}h`, tasks, res, H) };
}

/** Disrupted: fault added, maintenance board handled first-come-first-served (no re-planning). */
export function runDisrupted(sc: Scenario) {
  const tasks = [...EXISTING_TASKS, ...faultTasks(sc)];
  const res = schedule(tasks);
  return { tasks, res, metrics: measure("Disrupted", `Immediately after fault · no re-plan, projected to T+${sc.horizon}h`, tasks, res, sc.horizon) };
}

export interface RecoveryPlan {
  order: ScheduledTask[];
  metrics: StateMetrics;
  substitutions: { grounded: string; substitute: string; reason: string }[];
  constraints: string[];
  rationale: string[];
  segments: ReturnType<typeof schedule>["segments"];
}

/**
 * Constraint-aware re-plan. Evaluates a small, fixed set of candidate plans with the
 * same scheduler and keeps the best by (availability at horizon ↑, downtime ↓, recovery time ↓).
 * The unchanged first-come-first-served board is always a candidate, so the plan is never worse.
 */
export function runRecovery(sc: Scenario): RecoveryPlan {
  const all = [...EXISTING_TASKS, ...faultTasks(sc)];
  const air = (id: string) => AIRCRAFT.find((a) => a.id === id)!;
  const groundHours = (id: string) => all.filter((t) => t.aircraftId === id && t.grounding).reduce((p, t) => p + t.hours, 0);
  const ids = [...new Set(all.filter((t) => t.grounding).map((t) => t.aircraftId))];
  const byShortest = [...ids].sort((x, y) => groundHours(x) - groundHours(y) || air(x).missionPriority - air(y).missionPriority || x.localeCompare(y));
  const byPriority = [...ids].sort((x, y) => air(x).missionPriority - air(y).missionPriority || groundHours(x) - groundHours(y) || x.localeCompare(y));
  const build = (order: string[]) => [
    ...order.flatMap((id) => all.filter((t) => t.aircraftId === id && t.grounding)),
    ...all.filter((t) => !t.grounding),
  ];
  const candidates = [
    { name: "shortest-return-first with crew pairing", order: byShortest, tasks: build(byShortest), crewSplit: true },
    { name: "mission-priority-first with crew pairing", order: byPriority, tasks: build(byPriority), crewSplit: true },
    { name: "shortest-return-first", order: byShortest, tasks: build(byShortest), crewSplit: false },
    { name: "mission-priority-first", order: byPriority, tasks: build(byPriority), crewSplit: false },
    { name: "current board order (no change)", order: ids, tasks: all, crewSplit: false },
  ].map((c) => {
    const res = schedule(c.tasks, { crewSplit: c.crewSplit });
    return { ...c, res, metrics: measure("Proposed recovery", `Projected at T+${sc.horizon}h · requires approval`, c.tasks, res, sc.horizon) };
  });
  const best = [...candidates].sort(
    (a, b) => b.metrics.availabilityAtH - a.metrics.availabilityAtH || a.metrics.downtimeH - b.metrics.downtimeH || a.metrics.recoveryH - b.metrics.recoveryH,
  )[0];
  const { res, metrics } = best;
  const groundingAircraft = best.order;

  const stillDown = Object.entries(metrics.returnTimes).filter(([, t]) => t > sc.horizon).map(([id]) => id);
  const substitutions = stillDown.flatMap((id) => {
    const g = air(id);
    const sub = AIRCRAFT.filter((a) => a.id !== id && a.type === g.type && !(a.id in metrics.returnTimes) && a.missionPriority > g.missionPriority)
      .sort((a, b) => aircraftHealth(b) - aircraftHealth(a))[0];
    return sub ? [{ grounded: id, substitute: sub.id, reason: `${sub.id} is the healthiest operational ${g.type} on a lower-priority tasking (P${sub.missionPriority}); it can cover ${id}'s P${g.missionPriority} mission until ${id} returns at T+${Math.round(metrics.returnTimes[id])}h.` }] : [];
  });

  const constraints: string[] = [];
  res.scheduled.forEach((s) => {
    if (s.spare?.ordered) constraints.push(`${s.spare.ordered}× ${SPARES.find((p) => p.id === s.spare!.spareId)!.name} not in stock — resupply lead time ${s.spare.readyAt}h delays "${s.task.label}" (${s.task.aircraftId}).`);
  });
  stillDown.forEach((id) => constraints.push(`${id} cannot return within T+${sc.horizon}h: required repair + inspection finishes at T+${Math.round(metrics.returnTimes[id])}h given qualified technician shifts.`));

  const rationale = [
    `Selected strategy: ${best.name} (best of ${candidates.length} candidates by projected availability, then downtime, then recovery time).`,
    `Return-to-service order: ${groundingAircraft.join(" → ")}.`,
    ...(best.crewSplit ? ["Repairs of 12h or more are split across two qualified technicians on their own shifts when that finishes sooner."] : []),
    ...(best.tasks !== all ? ["Routine, non-grounding tasks are placed after all return-to-service work."] : []),
    "Every aircraft returns only after its repair AND its inspection are complete.",
  ];
  return { order: res.scheduled, metrics, substitutions, constraints, rationale, segments: res.segments };
}

export const fmtH = (h: number) => `T+${Math.round(h)}h`;
