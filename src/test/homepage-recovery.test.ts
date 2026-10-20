import { describe, expect, it } from "vitest";
import { HOMEPAGE_RECOVERY } from "@/components/homepage/recovery-scenario";

describe("Illustrative homepage recovery scenario", () => {
  it("has 100% baseline availability", () => expect(HOMEPAGE_RECOVERY.baseline.availability).toBe(100));
  it("has 83.3% disrupted availability", () => expect(HOMEPAGE_RECOVERY.disrupted.availability).toBe(83.3));
  it("has 100% proposed availability", () => expect(HOMEPAGE_RECOVERY.proposed.availability).toBe(100));
  it("has 110h full recovery without re-planning", () => expect(HOMEPAGE_RECOVERY.disrupted.recoveryH).toBe(110));
  it("has 60h full recovery with the proposal", () => expect(HOMEPAGE_RECOVERY.proposed.recoveryH).toBe(60));
});