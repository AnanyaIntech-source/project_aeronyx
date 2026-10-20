import { describe, expect, it } from "vitest";
import { AIRCRAFT, SPARES } from "@/lib/fleet/data";
import { runBaseline, runDisrupted, runRecovery, similarAircraft, availability } from "@/lib/fleet/engine";

const sc = { aircraftId: "AX-02", component: "engine" as const, severity: "critical" as const, horizon: 72 as const };

describe("fleet engine rules", () => {
  it("availability = operational / total × 100", () => {
    expect(availability(5, 6)).toBe(83.3);
  });
  it("baseline has AX-05 in maintenance", () => {
    expect(runBaseline(72).metrics.aircraftAffected).toEqual(["AX-05"]);
  });
  it("similar engine signatures are deterministic", () => {
    expect(similarAircraft("AX-02", "engine").map((m) => m.aircraft.id)).toEqual(["AX-04", "AX-06"]);
  });
  it("recovery plan is never worse than the disrupted projection", () => {
    for (const a of AIRCRAFT) for (const severity of ["minor", "major", "critical"] as const) for (const horizon of [24, 48, 72] as const) {
      const s = { aircraftId: a.id, component: "hydraulics" as const, severity, horizon };
      expect(runRecovery(s).metrics.availabilityAtH).toBeGreaterThanOrEqual(runDisrupted(s).metrics.availabilityAtH);
    }
  });
  it("technicians never overlap and stock never goes negative", () => {
    const r = runRecovery(sc);
    const byTech: Record<string, { start: number; end: number }[]> = {};
    r.segments.forEach((s) => (byTech[s.techId] ??= []).push(s));
    Object.values(byTech).forEach((segs) => {
      segs.sort((a, b) => a.start - b.start);
      for (let i = 1; i < segs.length; i++) expect(segs[i].start).toBeGreaterThanOrEqual(segs[i - 1].end - 1e-9);
    });
    expect(r.metrics.spareStock).toBeGreaterThanOrEqual(0);
    expect(SPARES.find((p) => p.id === "SP-ENG")!.stock).toBe(2); // baseline untouched
  });
  it("inspection never finishes before its repair", () => {
    const r = runRecovery(sc);
    const repair = r.order.find((s) => s.task.id === "F-1")!;
    const insp = r.order.find((s) => s.task.id === "F-2")!;
    expect(insp.start).toBeGreaterThanOrEqual(repair.end);
  });
});
