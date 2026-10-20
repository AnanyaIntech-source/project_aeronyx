import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { ArrowRight, ArrowUpRight, Check } from "lucide-react";
import apron from "@/assets/fleet-apron.jpg";
import { COMPONENTS, getAircraft, type ComponentKey } from "@/lib/fleet/data";
import { componentHealth, deviation, healthBand, runBaseline, runDisrupted, similarAircraft, weakestComponent } from "@/lib/fleet/engine";
import { DigitalTwinAircraft } from "@/components/homepage/DigitalTwinAircraft";
import { FleetNetwork } from "@/components/aerion/FleetNetwork";
import { Button } from "@/components/ui/button";
import { HOMEPAGE_RECOVERY } from "./recovery-scenario";

const scenario = { aircraftId: "AX-02", component: "engine" as const, severity: "critical" as const, horizon: 72 as const };
const baseline = runBaseline(72).metrics;
const disrupted = runDisrupted(scenario).metrics;
const reveal = { initial: { opacity: 0, y: 24 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.15 }, transition: { duration: 0.65 } };

function Chapter({ number, label, children }: { number: string; label: string; children: ReactNode }) {
  return <motion.div {...reveal}><p className="home-eyebrow"><span>{number}</span> / {label}</p>{children}</motion.div>;
}
function Readout({ label, value, tone = "" }: { label: string; value: ReactNode; tone?: string }) {
  return <div className="home-readout"><span>{label}</span><strong className={tone}>{value}</strong></div>;
}

export function Story() {
  const reduce = useReducedMotion();
  const [selected, setSelected] = useState("AX-02");
  const [component, setComponent] = useState<ComponentKey>("engine");
  const current = getAircraft(selected);
  const weakest = weakestComponent(current);
  const matches = similarAircraft(selected, weakest);
  const twin = getAircraft("AX-02");
  const sensorLabel = COMPONENTS.find((c) => c.key === component)?.label ?? component;
  const twinHealth = componentHealth(twin, component);
  const twinBand = healthBand(twinHealth);
  const twinTone = { critical: "text-critical", warning: "text-warning", success: "text-success" }[twinBand];
  const twinStatus = { critical: "Critical", warning: "Warning", success: "Healthy" }[twinBand];
  return <>
    <section id="technology" className="home-section home-challenge">
      <div className="home-challenge-heading"><Chapter number="01" label="The challenge"><h2>WHEN ONE AIRCRAFT FAILS,<br /><span className="text-muted-foreground">THE IMPACT DOESN’T<br />STOP THERE.</span></h2></Chapter><p className="home-copy">A fault is never isolated. It travels through schedules, spare inventories and maintenance teams — until one warning becomes a fleet-wide disruption.</p></div>
      <motion.div {...reveal} className="home-challenge-visual"><img src={apron} alt="Fighter aircraft awaiting their next mission on a midnight-blue airfield" width="1600" height="912" loading="lazy" /></motion.div>
      <div className="home-section-end"><span>ISOLATED SIGNALS</span><div /><ArrowRight /><span className="text-primary">CONNECTED DECISIONS</span></div>
    </section>

    <section id="fleet-intelligence" className="home-section home-fleet">
      <div className="home-fleet-content"><Chapter number="02" label="Collective fleet intelligence"><h2>ONE FLEET.<br /><span className="text-primary">SHARED INTELLIGENCE.</span></h2></Chapter><p className="home-copy">An emerging pattern on one airframe becomes an early warning for the others. Connect sensor signatures. See the risk beyond a single aircraft.</p><div className="home-signal-readout"><span className="home-status-dot" /><span>{selected} / {COMPONENTS.find((c) => c.key === weakest)?.label}</span><strong>{matches.length} shared {matches.length === 1 ? "signature" : "signatures"}</strong></div><p className="home-fineprint">Synthetic sensor signatures · rules-based similarity</p></div>
      <motion.div {...reveal} className="home-network"><div className="home-tool-header"><span>FLEET SIGNAL NETWORK</span><span>06 AIRFRAMES / DEMO</span></div><FleetNetwork selectedId={selected} component={weakest} onSelect={setSelected} className="w-full" /><div className="home-network-footer"><span className="text-primary">{selected}</span><span>{matches.map((m) => m.aircraft.id).join(" / ") || "No shared signature"}</span></div></motion.div>
    </section>

    <section id="digital-twin" className="home-section home-twin">
      <motion.div {...reveal} className="home-schematic"><div className="home-tool-header"><span>AX-02 / SYSTEM MAP</span><span className="text-warning">SYNTHETIC TELEMETRY</span></div><DigitalTwinAircraft aircraft={twin} selected={component} onSelect={setComponent} /><div className="home-schematic-caption"><span>{twin.callsign.toUpperCase()}</span><span>COMPONENT CONDITION / 100</span></div></motion.div>
      <div><Chapter number="03" label="Digital twin"><h2>EVERY COMPONENT.<br /><span className="text-primary">EVERY SIGNAL.</span></h2></Chapter><p className="home-copy">From engine vibration to structural fatigue, bring each system into focus. Trace a warning back to the readings behind it.</p><div className="home-component-list">{COMPONENTS.map((c) => <Button variant="ghost" key={c.key} onClick={() => setComponent(c.key)} aria-controls="home-twin-readings" aria-pressed={component === c.key} className={`home-component ${component === c.key ? "home-component-active" : ""}`}><span>{c.label}</span><span className={healthBand(componentHealth(twin, c.key)) === "critical" ? "text-critical" : healthBand(componentHealth(twin, c.key)) === "warning" ? "text-warning" : "text-success"}>{componentHealth(twin, c.key)}<small>/100</small></span><ArrowUpRight /></Button>)}</div><motion.div key={component} initial={reduce ? false : { opacity: 0.65, y: 3 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.3, ease: "easeInOut" }} id="home-twin-readings" className="home-sensors" role="region" aria-label="Selected component readings" aria-live="polite" aria-atomic="true"><p>{sensorLabel} / SENSOR READINGS</p><div className="home-twin-health"><strong>{twinHealth}/100</strong><span className={twinTone}>{twinStatus}</span></div>{twin.sensors[component].map((s) => <div key={s.name}><span>{s.name}</span><strong>{s.value}{s.unit}</strong><span>limit {s.limit}</span></div>)}<p className="home-twin-faults">{twin.sensors[component].filter((s) => deviation(s) >= 0.5).map((s) => <span key={s.name} className="text-critical">{s.name} · ANOMALY · {Math.round(deviation(s) * 100)}% of band</span>)}{twin.sensors[component].every((s) => deviation(s) < 0.5) && <span className="text-success">No sensor anomalies</span>}</p></motion.div></div>
    </section>

    <section id="simulation" className="home-section home-disruption">
      <div className="home-split-heading"><Chapter number="04" label="Failure domino simulator"><h2>ONE FAILURE.<br /><span className="text-critical">MULTIPLE CONSEQUENCES.</span></h2></Chapter><p className="home-copy">Follow the chain reaction before it happens. One critical engine fault. Six airframes. A 72-hour decision window.</p></div>
      <motion.div className="home-domino" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={{ hidden: {}, visible: { transition: { staggerChildren: reduce ? 0 : 0.65 } } }}>{[
        ["Engine fault", "AX-02 / CRITICAL", "01"],
        ["Aircraft grounded", `${disrupted.aircraftAffected.length} AIRFRAMES AFFECTED`, "02"],
        ["Spares drained", `${baseline.spareStock} → ${disrupted.spareStock} UNITS`, "03"],
        ["Teams stretched", `${baseline.techUtilization}% → ${disrupted.techUtilization}% UTILIZATION`, "04"],
        ["Readiness drops", `${baseline.availabilityNow}% → ${disrupted.availabilityNow}% NOW`, "05"],
      ].map(([title, detail, n], i) => <motion.div key={title} variants={{ hidden: { opacity: 0, y: reduce ? 0 : 16 }, visible: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } } }} className="home-domino-step"><div className="home-domino-track"><span>{n}</span>{i < 4 && <ArrowRight />}</div><h3>{title}</h3><p>{detail}</p></motion.div>)}</motion.div>
      <div className="home-disruption-bottom"><p className="home-fineprint">AX-02 · critical engine fault · 72h horizon<br />Computed by the Fleet Command rules engine.</p><Button asChild variant="outline" className="home-cta home-cta-outline"><Link to="/dashboard/simulator">Explore the simulator <ArrowUpRight /></Link></Button></div>
    </section>

    <section id="recovery" className="home-section home-recovery">
      <div><Chapter number="05" label="Self-healing fleet engine"><h2>FROM DISRUPTION<br />TO <span className="text-primary">INTELLIGENT<br />RECOVERY.</span></h2></Chapter><p className="home-copy">A better sequence. The right people. Spares that actually exist. A constraint-aware recovery proposal — with the final decision always in human hands.</p><ul className="home-constraints">{["Qualified technicians", "Compatible spare inventory", "Inspection before return to service"].map((item) => <li key={item}><Check aria-hidden="true" />{item}</li>)}</ul><div className="home-section-end"><Button asChild variant="outline" className="home-cta home-cta-outline"><Link to="/dashboard/recovery">Explore recovery <ArrowUpRight /></Link></Button></div></div>
      <motion.div {...reveal} className="home-recovery-chart">
        <div className="home-tool-header"><span>FLEET AVAILABILITY</span><span>T + 72 HOURS / ILLUSTRATIVE</span></div>
        {[
          { label: "Baseline", value: HOMEPAGE_RECOVERY.baseline.availability, tone: "text-success", fill: "bg-success" },
          { label: "Disrupted / no re-plan", value: HOMEPAGE_RECOVERY.disrupted.availability, tone: "text-critical", fill: "bg-critical home-chart-fill-disrupted" },
          { label: "Proposed recovery", value: HOMEPAGE_RECOVERY.proposed.availability, tone: "text-primary", fill: "bg-primary" },
        ].map(({ label, value, tone, fill }) => <div className="home-chart-row" key={label}><div><span>{label}</span><strong className={tone}>{value}%</strong></div><div className="home-chart-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><div className={`home-chart-fill ${fill}`} /></div></div>)}
        <div className="home-recovery-summary"><Readout label="FULL RECOVERY / NO RE-PLAN" value={`T+${HOMEPAGE_RECOVERY.disrupted.recoveryH}h`} /><Readout label="FULL RECOVERY / PROPOSED" value={`T+${HOMEPAGE_RECOVERY.proposed.recoveryH}h`} tone="text-primary" /></div><p className="home-fineprint">Illustrative scenario · synthetic data · human approval required</p>
      </motion.div>
    </section>

    <section id="fleet-command" className="home-section home-command"><div className="home-command-heading"><Chapter number="06" label="Fleet Command"><h2>THE ENTIRE FLEET.<br /><span className="text-primary">ONE INTELLIGENCE LAYER.</span></h2></Chapter><Button asChild className="home-cta"><Link to="/dashboard">Enter Fleet Command <ArrowUpRight /></Link></Button></div><motion.div {...reveal} className="home-dashboard-preview"><div className="home-tool-header"><span><span className="home-status-dot" />AERONYX / FLEET COMMAND</span><span>SYNTHETIC FLEET</span></div><Link to="/dashboard" aria-label="Open Fleet Command dashboard"><img src="/images/fleet-command-preview.png" alt="The actual AERONYX Fleet Command overview, including aircraft readiness, sensor warnings and fleet metrics" width="1280" height="900" loading="lazy" /></Link></motion.div></section>
    <footer id="about" className="home-footer"><a href="#top" className="home-brand">AERONYX<span className="home-brand-dot" /></a><p>SIH 2026 · PS 26249<br />Research prototype · fictional aircraft · synthetic data · rules-based decision support.<br />All recommendations require qualified human approval.</p><a href="#top" className="home-back-top" aria-label="Back to top"><ArrowUpRight /></a></footer>
  </>;
}
