import { SEVERITY_RULES, SHIFT_HOURS, SIMILARITY_THRESHOLD } from "@/lib/fleet/engine";
import { SPARES, TECHNICIANS } from "@/lib/fleet/data";

export function Assumptions() {
  return (
    <details className="panel group p-5">
      <summary className="cursor-pointer list-none font-display text-base font-semibold">
        <span className="label-mono mr-2">Simulation assumptions</span>How metrics are calculated <span className="text-primary group-open:hidden">+</span>
      </summary>
      <div className="mt-4 grid gap-4 text-sm text-muted-foreground md:grid-cols-2">
        <div className="space-y-2">
          <p><b className="text-foreground">Fleet availability</b> = operational aircraft ÷ {6} × 100. An aircraft is unavailable while any grounding task (repair or inspection) is incomplete.</p>
          <p><b className="text-foreground">Technician utilization</b> = hours worked inside the horizon ÷ ({TECHNICIANS.length} technicians × {SHIFT_HOURS}h × horizon days).</p>
          <p><b className="text-foreground">Maintenance backlog</b> = tasks that cannot finish within the selected horizon.</p>
          <p><b className="text-foreground">Downtime</b> = sum of grounded aircraft-hours inside the horizon. <b className="text-foreground">Recovery time</b> = hour the last grounded aircraft completes repair + inspection.</p>
          <p><b className="text-foreground">Spares</b> are deducted only when allocated; stock never goes negative. Shortfalls are ordered and arrive after the part's lead time ({SPARES.map((s) => `${s.leadTimeH}h`).join("/")}).</p>
        </div>
        <div className="space-y-2">
          {Object.values(SEVERITY_RULES).map((r) => <p key={r.label}><b className="text-foreground">{r.label}:</b> {r.description}</p>)}
          <p><b className="text-foreground">Similarity</b>: cosine similarity ≥ {SIMILARITY_THRESHOLD} of normalized sensor deviations on the same system.</p>
          <p><b className="text-foreground">Scheduling</b>: each technician works one {SHIFT_HOURS}h shift per day, one task at a time, only on matching skills. Inspections start only after the repair finishes.</p>
          <p className="text-warning">Estimates come from fictional data and fixed rules — not validated maintenance forecasts.</p>
        </div>
      </div>
    </details>
  );
}
