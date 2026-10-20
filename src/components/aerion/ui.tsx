import type { ReactNode } from "react";
import { Info } from "lucide-react";

export function Panel({ title, kicker, children, className = "", right }: { title?: string; kicker?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`panel p-5 ${className}`}>
      {(title || kicker) && (
        <header className="mb-4 flex items-start justify-between gap-4">
          <div>
            {kicker && <p className="label-mono mb-1">{kicker}</p>}
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
          </div>
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Metric({ label, value, sub, tone = "default" }: { label: string; value: ReactNode; sub?: ReactNode; tone?: "default" | "success" | "warning" | "critical" | "primary" }) {
  const t = { default: "text-foreground", success: "text-success", warning: "text-warning", critical: "text-critical", primary: "text-primary" }[tone];
  return (
    <div className="rounded-md border border-border bg-background/40 p-3">
      <p className="label-mono">{label}</p>
      <p className={`mt-1 font-display text-2xl font-semibold tabular-nums ${t}`}>{value}</p>
      {sub && <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function SimBadge({ children = "Simulated data" }: { children?: ReactNode }) {
  return <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-warning">{children}</span>;
}

export function Explain({ q, children }: { q: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-3">
      <p className="mb-1 flex items-center gap-1.5 text-sm font-medium text-primary"><Info className="h-3.5 w-3.5" />{q}</p>
      <div className="space-y-1 text-sm text-muted-foreground">{children}</div>
    </div>
  );
}

export function HealthBar({ value }: { value: number }) {
  const tone = value < 40 ? "bg-critical" : value < 60 ? "bg-warning" : "bg-success";
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full ${tone} transition-all duration-500`} style={{ width: `${value}%` }} />
    </div>
  );
}

export const btnPrimary = "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground transition hover:glow hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40";
export const btnGhost = "inline-flex items-center justify-center gap-2 rounded-md border border-primary/40 px-5 py-2.5 font-mono text-xs font-semibold uppercase tracking-[0.18em] text-foreground transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-40";
