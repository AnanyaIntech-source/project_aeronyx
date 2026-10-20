// Explicitly illustrative public-homepage values; never used by the fleet engine.
export const HOMEPAGE_RECOVERY = {
  baseline: { availability: 100 },
  disrupted: { availability: 83.3, recoveryH: 110 },
  proposed: { availability: 100, recoveryH: 60 },
} as const;