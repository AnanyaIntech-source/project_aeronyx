import { createFileRoute } from "@tanstack/react-router";
import { EXISTING_TASKS, SPARES, TECHNICIANS } from "@/lib/fleet/data";
import { Panel, SimBadge } from "@/components/aerion/ui";

export const Route = createFileRoute("/dashboard/maintenance")({
  head: () => ({ meta: [{ title: "Maintenance (Preview) — AERONYX" }, { name: "description", content: "Read-only preview of the maintenance board, spares and technicians." }, { property: "og:title", content: "Maintenance — AERONYX" }, { property: "og:description", content: "Maintenance board preview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Maintenance,
});

function Maintenance() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="label-mono">Maintenance · <span className="text-warning">Preview</span></p><h1 className="mt-1 text-3xl font-bold">Maintenance board</h1></div>
        <SimBadge>Preview · read-only</SimBadge>
      </div>
      <Panel kicker="Baseline" title="Open tasks">
        <table className="w-full text-sm">
          <thead className="label-mono text-left"><tr><th className="py-2">ID</th><th>Aircraft</th><th>Task</th><th>Skill</th><th>Hours</th><th>Type</th></tr></thead>
          <tbody>{EXISTING_TASKS.map((t) => (
            <tr key={t.id} className="border-t border-border"><td className="py-2 font-mono">{t.id}</td><td className="font-mono">{t.aircraftId}</td><td>{t.label}</td><td className="text-muted-foreground">{t.skill}</td><td className="font-mono">{t.hours}</td><td className={t.grounding ? "text-warning" : "text-muted-foreground"}>{t.grounding ? "Grounding" : "Routine"}</td></tr>
          ))}</tbody>
        </table>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        <Panel kicker="Inventory" title="Spare parts">
          {SPARES.map((s) => <div key={s.id} className="flex justify-between border-t border-border py-2 text-sm"><span>{s.name}<span className="ml-2 text-xs text-muted-foreground">{s.compatible.join(" / ")}</span></span><span className="font-mono">{s.stock} · lead {s.leadTimeH}h</span></div>)}
        </Panel>
        <Panel kicker="Workforce" title="Technicians">
          {TECHNICIANS.map((t) => <div key={t.id} className="flex justify-between border-t border-border py-2 text-sm"><span>{t.name}</span><span className="font-mono text-xs text-muted-foreground">{t.skills.join(", ")} · {String(t.shiftStartH).padStart(2, "0")}:00–{String((t.shiftStartH + 8) % 24).padStart(2, "0")}:00</span></div>)}
        </Panel>
      </div>
    </div>
  );
}
