import { createFileRoute } from "@tanstack/react-router";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { COMPONENTS, getAircraft } from "@/lib/fleet/data";
import { sensorHistory } from "@/lib/fleet/engine";
import { useFleet } from "@/lib/fleet/store";
import { Panel, SimBadge } from "@/components/aerion/ui";

export const Route = createFileRoute("/dashboard/analytics")({
  head: () => ({ meta: [{ title: "Predictive Analytics (Preview) — AERONYX" }, { name: "description", content: "Preview of sensor trend analytics for the selected aircraft." }, { property: "og:title", content: "Predictive Analytics — AERONYX" }, { property: "og:description", content: "Sensor trend preview." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
  component: Analytics,
});

function Analytics() {
  const f = useFleet();
  const a = getAircraft(f.selectedId);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="label-mono">Predictive Analytics · <span className="text-warning">Preview</span></p><h1 className="mt-1 text-3xl font-bold">Sensor trends — {a.id} {a.callsign}</h1></div>
        <SimBadge>Preview · synthetic history</SimBadge>
      </div>
      <p className="max-w-2xl text-sm text-muted-foreground">Read-only preview of 14-day synthetic sensor histories for the aircraft selected elsewhere in Fleet Command. No forecasting model is connected yet — this view is reserved for a future prediction service.</p>
      <div className="grid gap-4 md:grid-cols-2">
        {COMPONENTS.map((c) => (
          <Panel key={c.key} kicker={c.label} title={a.sensors[c.key][0].name}>
            <div className="h-44">
              <ResponsiveContainer>
                <LineChart data={sensorHistory(a.sensors[c.key][0])}>
                  <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={10} domain={["auto", "auto"]} />
                  <Tooltip contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)" }} />
                  <ReferenceLine y={a.sensors[c.key][0].limit} stroke="var(--critical)" strokeDasharray="4 4" />
                  <Line dataKey="value" stroke="var(--primary)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
