import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, MotionConfig, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";
import { ArrowDown, ArrowUpRight } from "lucide-react";
import hero from "@/assets/hero-aircraft.jpg";
import { Button } from "@/components/ui/button";
import { Navigation } from "@/components/homepage/Navigation";
import { Story } from "@/components/homepage/Story";
import "@/components/homepage/homepage.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AERONYX — Aircraft Intelligence. Mission Readiness." },
      { name: "description", content: "Explore AERONYX: an aerospace research prototype connecting synthetic aircraft signals, fleet disruption simulations and human-approved recovery planning." },
      { property: "og:title", content: "AERONYX — Aircraft Intelligence. Mission Readiness." },
      { property: "og:description", content: "One aircraft. One warning. Connected fleet intelligence, digital twins and constraint-aware recovery using synthetic data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const heroRef = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "6%"]);
  return <MotionConfig reducedMotion="user"><main id="top" className="aerion-home"><Navigation />
    <section ref={heroRef} className="home-hero" aria-labelledby="home-headline">
      <motion.div className="home-hero-image" style={reduce ? undefined : { y }} initial={{ opacity: reduce ? 1 : 0.35 }} animate={{ opacity: 1 }} transition={{ duration: 1.8 }}><img src={hero} alt="Silver fighter aircraft inside a dramatically lit navy-blue hangar" width="1920" height="1080" fetchPriority="high" /></motion.div>
      <div className="home-hero-shade" />
      <div className="home-hero-content">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="home-eyebrow">AERONYX / COLLECTIVE FLEET INTELLIGENCE</motion.p>
        <h1 id="home-headline">{["AIRCRAFT INTELLIGENCE.", "MISSION READINESS."].map((line, i) => <span className="home-headline-mask" key={line}><motion.span className={i === 1 ? "text-primary" : ""} initial={{ opacity: 0, y: reduce ? 0 : 70 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 + i * 0.22, duration: 1, ease: [0.22, 1, 0.36, 1] }}>{line}</motion.span></span>)}</h1>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1, duration: 0.9 }} className="home-hero-bottom"><div className="home-hero-description"><p className="home-hero-concept">One aircraft. One warning. An entire fleet protected.</p><p>Predict emerging faults, anticipate fleet-wide disruptions,<br className="home-desktop-break" /> and coordinate intelligent recovery.</p></div><motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.25, duration: 0.8 }} className="home-hero-actions"><Button asChild className="home-cta"><Link to="/dashboard">Enter Fleet Command <ArrowUpRight /></Link></Button><Button asChild variant="outline" className="home-cta home-cta-outline"><a href="#technology">Explore the Technology <ArrowDown /></a></Button></motion.div></motion.div>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.65, duration: 0.8 }} className="home-hero-footer"><a href="#technology"><ArrowDown /> DISCOVER AERONYX</a><span>SIH 2026 / PS 26249 · RESEARCH PROTOTYPE</span></motion.div>
    </section>
    <Story />
  </main></MotionConfig>;
}
