import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ComponentKey } from "./data";
import { runBaseline, runDisrupted, runRecovery, weakestComponent, type Scenario } from "./engine";
import { getAircraft } from "./data";

interface FleetState {
  selectedId: string;
  selectedComponent: ComponentKey;
  scenario: Scenario;
  simulated: boolean;
  planGenerated: boolean;
  runId: number;
}

const DEFAULT: FleetState = {
  selectedId: "AX-02",
  selectedComponent: "engine",
  scenario: { aircraftId: "AX-02", component: "engine", severity: "critical", horizon: 72 },
  simulated: false,
  planGenerated: false,
  runId: 0,
};

const KEY = "aerion-session-v1";

function useFleetValue() {
  const [state, setState] = useState<FleetState>(DEFAULT);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) setState({ ...DEFAULT, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  }, [state]);

  const baseline = useMemo(() => runBaseline(state.scenario.horizon), [state.scenario.horizon]);
  const disrupted = useMemo(() => (state.simulated ? runDisrupted(state.scenario) : null), [state.simulated, state.scenario]);
  const recovery = useMemo(() => (state.planGenerated ? runRecovery(state.scenario) : null), [state.planGenerated, state.scenario]);

  return {
    ...state,
    baseline, disrupted, recovery,
    selectAircraft: (id: string) =>
      setState((s) => ({ ...s, selectedId: id, selectedComponent: weakestComponent(getAircraft(id)) })),
    selectComponent: (c: ComponentKey) => setState((s) => ({ ...s, selectedComponent: c })),
    setScenario: (p: Partial<Scenario>) => setState((s) => ({ ...s, scenario: { ...s.scenario, ...p }, simulated: false, planGenerated: false })),
    simulate: () => setState((s) => ({ ...s, simulated: true, planGenerated: false, runId: s.runId + 1 })),
    replay: () => setState((s) => ({ ...s, runId: s.runId + 1 })),
    generatePlan: () => setState((s) => ({ ...s, planGenerated: true })),
    reset: () => setState((s) => ({ ...DEFAULT, runId: s.runId + 1 })),
  };
}

type Ctx = ReturnType<typeof useFleetValue>;
const FleetCtx = createContext<Ctx | null>(null);
export function FleetProvider({ children }: { children: ReactNode }) {
  const v = useFleetValue();
  return <FleetCtx.Provider value={v}>{children}</FleetCtx.Provider>;
}
export function useFleet() {
  const c = useContext(FleetCtx);
  if (!c) throw new Error("useFleet must be used within FleetProvider");
  return c;
}
