// AERION — fictional, synthetic demonstration dataset. Immutable baseline.
// Not real aircraft, telemetry or maintenance data.

export type ComponentKey = "engine" | "hydraulics" | "avionics" | "structure";
export type Skill = ComponentKey | "inspection";
export type AircraftType = "AR-7 Falcon" | "AR-9 Kestrel";

export const COMPONENTS: { key: ComponentKey; label: string }[] = [
  { key: "engine", label: "Engines" },
  { key: "hydraulics", label: "Hydraulics" },
  { key: "avionics", label: "Avionics" },
  { key: "structure", label: "Structural" },
];

export interface Sensor {
  name: string;
  unit: string;
  baseline: number; // nominal value
  limit: number; // value at which the reading is at its alert limit
  value: number; // latest simulated reading
}

export interface Aircraft {
  id: string;
  callsign: string;
  type: AircraftType;
  base: string;
  missionPriority: 1 | 2 | 3; // 1 = highest
  flightHours: number;
  sensors: Record<ComponentKey, Sensor[]>;
}

export interface Spare {
  id: string;
  name: string;
  component: ComponentKey;
  compatible: AircraftType[];
  stock: number;
  leadTimeH: number; // resupply lead time if stock is exhausted
}

export interface Technician {
  id: string;
  name: string;
  skills: Skill[];
  shiftStartH: number; // hour of day the 8h shift starts
}

export interface Task {
  id: string;
  aircraftId: string;
  label: string;
  skill: Skill;
  hours: number;
  spareId?: string;
  spareQty?: number;
  grounding: boolean; // aircraft is unavailable until this task is complete
  dependsOn?: string;
  origin: "existing" | "fault" | "cascade";
}

const s = (name: string, unit: string, baseline: number, limit: number, value: number): Sensor => ({ name, unit, baseline, limit, value });

export const AIRCRAFT: readonly Aircraft[] = [
  {
    id: "AX-01", callsign: "Vajra", type: "AR-7 Falcon", base: "Base North", missionPriority: 1, flightHours: 2140,
    sensors: {
      engine: [s("EGT", "°C", 610, 720, 622), s("Vibration", "ips", 0.4, 1.2, 0.46), s("Oil pressure drop", "psi", 0, 15, 1.5)],
      hydraulics: [s("System pressure loss", "psi", 0, 400, 30), s("Fluid temp", "°C", 60, 105, 64), s("Pump current", "A", 18, 30, 18.6)],
      avionics: [s("Bus voltage ripple", "mV", 20, 120, 26), s("LRU temp", "°C", 45, 85, 48), s("BIT faults /100h", "", 0, 10, 0.5)],
      structure: [s("Wing strain", "µε", 800, 1600, 860), s("Fatigue index", "", 0.2, 1, 0.26), s("Corrosion score", "", 0, 10, 0.8)],
    },
  },
  {
    id: "AX-02", callsign: "Garuda", type: "AR-7 Falcon", base: "Base North", missionPriority: 1, flightHours: 3310,
    sensors: {
      engine: [s("EGT", "°C", 610, 720, 688), s("Vibration", "ips", 0.4, 1.2, 0.98), s("Oil pressure drop", "psi", 0, 15, 4.2)],
      hydraulics: [s("System pressure loss", "psi", 0, 400, 60), s("Fluid temp", "°C", 60, 105, 66), s("Pump current", "A", 18, 30, 19.1)],
      avionics: [s("Bus voltage ripple", "mV", 20, 120, 30), s("LRU temp", "°C", 45, 85, 50), s("BIT faults /100h", "", 0, 10, 1)],
      structure: [s("Wing strain", "µε", 800, 1600, 940), s("Fatigue index", "", 0.2, 1, 0.38), s("Corrosion score", "", 0, 10, 1.5)],
    },
  },
  {
    id: "AX-03", callsign: "Agni", type: "AR-9 Kestrel", base: "Base South", missionPriority: 2, flightHours: 1870,
    sensors: {
      engine: [s("EGT", "°C", 610, 720, 628), s("Vibration", "ips", 0.4, 1.2, 0.5), s("Oil pressure drop", "psi", 0, 15, 1)],
      hydraulics: [s("System pressure loss", "psi", 0, 400, 270), s("Fluid temp", "°C", 60, 105, 92), s("Pump current", "A", 18, 30, 21)],
      avionics: [s("Bus voltage ripple", "mV", 20, 120, 34), s("LRU temp", "°C", 45, 85, 52), s("BIT faults /100h", "", 0, 10, 1.4)],
      structure: [s("Wing strain", "µε", 800, 1600, 880), s("Fatigue index", "", 0.2, 1, 0.3), s("Corrosion score", "", 0, 10, 1)],
    },
  },
  {
    id: "AX-04", callsign: "Trishul", type: "AR-7 Falcon", base: "Base North", missionPriority: 2, flightHours: 2980,
    sensors: {
      engine: [s("EGT", "°C", 610, 720, 672), s("Vibration", "ips", 0.4, 1.2, 0.86), s("Oil pressure drop", "psi", 0, 15, 3.4)],
      hydraulics: [s("System pressure loss", "psi", 0, 400, 50), s("Fluid temp", "°C", 60, 105, 65), s("Pump current", "A", 18, 30, 18.8)],
      avionics: [s("Bus voltage ripple", "mV", 20, 120, 70), s("LRU temp", "°C", 45, 85, 55), s("BIT faults /100h", "", 0, 10, 2)],
      structure: [s("Wing strain", "µε", 800, 1600, 900), s("Fatigue index", "", 0.2, 1, 0.34), s("Corrosion score", "", 0, 10, 1.2)],
    },
  },
  {
    id: "AX-05", callsign: "Prithvi", type: "AR-9 Kestrel", base: "Base South", missionPriority: 3, flightHours: 4020,
    sensors: {
      engine: [s("EGT", "°C", 610, 720, 634), s("Vibration", "ips", 0.4, 1.2, 0.52), s("Oil pressure drop", "psi", 0, 15, 1.8)],
      hydraulics: [s("System pressure loss", "psi", 0, 400, 210), s("Fluid temp", "°C", 60, 105, 85), s("Pump current", "A", 18, 30, 20.4)],
      avionics: [s("Bus voltage ripple", "mV", 20, 120, 28), s("LRU temp", "°C", 45, 85, 49), s("BIT faults /100h", "", 0, 10, 0.8)],
      structure: [s("Wing strain", "µε", 800, 1600, 1280), s("Fatigue index", "", 0.2, 1, 0.71), s("Corrosion score", "", 0, 10, 5.5)],
    },
  },
  {
    id: "AX-06", callsign: "Astra", type: "AR-9 Kestrel", base: "Base South", missionPriority: 3, flightHours: 2560,
    sensors: {
      engine: [s("EGT", "°C", 610, 720, 655), s("Vibration", "ips", 0.4, 1.2, 0.74), s("Oil pressure drop", "psi", 0, 15, 2.6)],
      hydraulics: [s("System pressure loss", "psi", 0, 400, 40), s("Fluid temp", "°C", 60, 105, 63), s("Pump current", "A", 18, 30, 18.4)],
      avionics: [s("Bus voltage ripple", "mV", 20, 120, 88), s("LRU temp", "°C", 45, 85, 63), s("BIT faults /100h", "", 0, 10, 4.5)],
      structure: [s("Wing strain", "µε", 800, 1600, 870), s("Fatigue index", "", 0.2, 1, 0.29), s("Corrosion score", "", 0, 10, 0.9)],
    },
  },
];

export const SPARES: readonly Spare[] = [
  { id: "SP-ENG", name: "Turbine module kit", component: "engine", compatible: ["AR-7 Falcon", "AR-9 Kestrel"], stock: 2, leadTimeH: 36 },
  { id: "SP-HYD", name: "Hydraulic pump assembly", component: "hydraulics", compatible: ["AR-7 Falcon", "AR-9 Kestrel"], stock: 1, leadTimeH: 24 },
  { id: "SP-AVF", name: "Mission computer LRU (Falcon)", component: "avionics", compatible: ["AR-7 Falcon"], stock: 1, leadTimeH: 30 },
  { id: "SP-AVK", name: "Mission computer LRU (Kestrel)", component: "avionics", compatible: ["AR-9 Kestrel"], stock: 1, leadTimeH: 30 },
  { id: "SP-STR", name: "Structural repair kit", component: "structure", compatible: ["AR-7 Falcon", "AR-9 Kestrel"], stock: 2, leadTimeH: 48 },
];

export const TECHNICIANS: readonly Technician[] = [
  { id: "T1", name: "Sgt. R. Menon", skills: ["engine"], shiftStartH: 6 },
  { id: "T2", name: "Cpl. A. Iyer", skills: ["engine", "hydraulics"], shiftStartH: 14 },
  { id: "T3", name: "Sgt. K. Rao", skills: ["hydraulics", "structure"], shiftStartH: 6 },
  { id: "T4", name: "Cpl. S. Das", skills: ["avionics"], shiftStartH: 14 },
  { id: "T5", name: "WO P. Nair", skills: ["structure", "inspection"], shiftStartH: 6 },
  { id: "T6", name: "Sgt. M. Khan", skills: ["inspection", "avionics"], shiftStartH: 22 },
];

// Existing maintenance already on the board before any disruption.
export const EXISTING_TASKS: readonly Task[] = [
  { id: "M-101", aircraftId: "AX-05", label: "Wing-root fatigue repair", skill: "structure", hours: 10, spareId: "SP-STR", spareQty: 1, grounding: true, origin: "existing" },
  { id: "M-102", aircraftId: "AX-05", label: "Post-repair structural inspection", skill: "inspection", hours: 3, grounding: true, dependsOn: "M-101", origin: "existing" },
  { id: "M-103", aircraftId: "AX-01", label: "200h engine borescope (routine)", skill: "engine", hours: 8, grounding: false, origin: "existing" },
  { id: "M-104", aircraftId: "AX-04", label: "Avionics software load (routine)", skill: "avionics", hours: 4, grounding: false, origin: "existing" },
  { id: "M-105", aircraftId: "AX-06", label: "Engine oil system service (routine)", skill: "engine", hours: 6, grounding: false, origin: "existing" },
  { id: "M-106", aircraftId: "AX-03", label: "Hydraulic line leak check (routine)", skill: "hydraulics", hours: 5, grounding: false, origin: "existing" },
];

export const getAircraft = (id: string) => AIRCRAFT.find((a) => a.id === id)!;
export const getSpare = (id: string) => SPARES.find((p) => p.id === id)!;
