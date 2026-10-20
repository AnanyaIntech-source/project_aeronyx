import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Activity, BarChart3, Boxes, Cpu, GitBranch, LayoutGrid, Wrench, Zap } from "lucide-react";
import { FleetProvider, useFleet } from "@/lib/fleet/store";
import { SimBadge } from "@/components/aerion/ui";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Fleet Command — AERONYX" },
      { name: "description", content: "AERONYX command center: fleet intelligence, digital twin, failure domino simulator and recovery engine." },
      { property: "og:title", content: "Fleet Command — AERONYX" },
      { property: "og:description", content: "Simulate an aircraft fault, watch fleet consequences spread, and generate a constraint-aware recovery plan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardLayout,
});

const NAV = [
  { to: "/dashboard", label: "Overview", icon: LayoutGrid, exact: true },
  { to: "/dashboard/fleet", label: "Fleet Intelligence", icon: GitBranch },
  { to: "/dashboard/twin", label: "Digital Twin", icon: Cpu },
  { to: "/dashboard/simulator", label: "Domino Simulator", icon: Zap },
  { to: "/dashboard/recovery", label: "Recovery Engine", icon: Activity },
  { to: "/dashboard/analytics", label: "Predictive Analytics", icon: BarChart3, preview: true },
  { to: "/dashboard/maintenance", label: "Maintenance", icon: Wrench, preview: true },
] as const;

function DashboardLayout() {
  return (
    <FleetProvider>
      <div className="flex min-h-screen bg-background">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
          <Link to="/" className="mb-8 flex items-center gap-2 px-2">
            <Boxes className="h-5 w-5 text-primary" />
            <span className="font-display text-lg font-bold tracking-[0.25em]">AERONYX</span>
          </Link>
          <nav className="flex flex-col gap-1">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground transition hover:bg-sidebar-accent hover:text-foreground data-[status=active]:bg-sidebar-accent data-[status=active]:text-primary">
                <n.icon className="h-4 w-4" />
                <span className="flex-1">{n.label}</span>
                {"preview" in n && <span className="font-mono text-[9px] uppercase tracking-wider text-warning">Preview</span>}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-2 px-2 text-[11px] leading-relaxed text-muted-foreground">
            <SimBadge>Research prototype</SimBadge>
            <p>Fictional aircraft & synthetic data. Rules-based decision support — all actions require qualified human approval.</p>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <TopBar />
          <nav className="flex gap-2 overflow-x-auto border-b border-border px-4 py-2 md:hidden">
            {NAV.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: "exact" in n }} className="whitespace-nowrap rounded px-2 py-1 text-xs text-muted-foreground data-[status=active]:bg-secondary data-[status=active]:text-primary">{n.label}</Link>
            ))}
          </nav>
          <main className="tech-grid min-h-[calc(100vh-57px)] p-4 md:p-6"><Outlet /></main>
        </div>
      </div>
    </FleetProvider>
  );
}

function TopBar() {
  const f = useFleet();
  const steps = [
    { label: "Select", done: true },
    { label: "Detect", done: true },
    { label: "Simulate", done: f.simulated },
    { label: "Impact", done: f.simulated },
    { label: "Recover", done: f.planGenerated },
    { label: "Compare", done: f.planGenerated },
  ];
  return (
    <header className="sticky top-0 z-20 flex h-[57px] items-center justify-between gap-4 border-b border-border bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3 font-mono text-xs">
        <span className="text-muted-foreground">SELECTED</span>
        <span className="rounded bg-primary/15 px-2 py-1 text-primary">{f.selectedId}</span>
      </div>
      <ol className="hidden items-center gap-1 lg:flex" aria-label="Workflow progress">
        {steps.map((s, i) => (
          <li key={s.label} className="flex items-center gap-1">
            <span className={`rounded px-2 py-1 font-mono text-[10px] uppercase tracking-widest ${s.done ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>{s.label}</span>
            {i < steps.length - 1 && <span className="text-muted-foreground/40">›</span>}
          </li>
        ))}
      </ol>
      <button onClick={f.reset} className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-foreground">Reset demo</button>
    </header>
  );
}
