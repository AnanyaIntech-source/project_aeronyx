import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { motion, useReducedMotion, useScroll } from "motion/react";
import { Button } from "@/components/ui/button";

const sections = [
  ["top", "Home"], ["technology", "Technology"], ["digital-twin", "Digital Twin"],
  ["fleet-intelligence", "Intelligence"], ["about", "About"],
] as const;

export function Navigation() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const { scrollYProgress } = useScroll();
  const reduce = useReducedMotion();
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 36);
    update();
    window.addEventListener("scroll", update, { passive: true });
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) setActive(entry.target.id); });
    }, { rootMargin: "-20% 0px -55% 0px" });
    sections.forEach(([id]) => { const el = document.getElementById(id); if (el) observer.observe(el); });
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", escape);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("keydown", escape); observer.disconnect(); };
  }, []);
  return (
    <header className={`home-nav ${scrolled || open ? "home-nav-solid" : ""}`}>
      <div className="home-nav-inner">
        <a href="#top" className="home-brand" aria-label="AERONYX home"><svg viewBox="0 0 28 28" fill="none" aria-hidden="true"><path d="M3 23 14 4l11 19M8 17h12M14 4v9" stroke="currentColor" strokeWidth="1.5" /></svg>AERONYX</a>
        <nav aria-label="Homepage sections" className="home-desktop-nav">
          {sections.map(([id, label]) => <a key={id} href={`#${id}`} aria-current={active === id ? "location" : undefined} className="home-nav-link">{label}{active === id && <motion.span layoutId="active-section" className="home-active-line" transition={{ duration: reduce ? 0 : 0.25 }} />}</a>)}
        </nav>
        <Button asChild variant="ghost" className="home-nav-cta"><Link to="/dashboard">Enter Platform <ArrowUpRight /></Link></Button>
        <Button variant="ghost" size="icon" className="home-menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="home-mobile-nav" onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</Button>
      </div>
      {open && <nav id="home-mobile-nav" aria-label="Mobile homepage sections" className="home-mobile-nav">{sections.map(([id, label], index) => <a key={id} href={`#${id}`} onClick={() => setOpen(false)}><span>0{index + 1}</span>{label}<ArrowUpRight /></a>)}<Button asChild className="home-cta"><Link to="/dashboard" onClick={() => setOpen(false)}>Enter Platform <ArrowUpRight /></Link></Button></nav>}
      <motion.div className="home-scroll-progress" style={{ scaleX: scrollYProgress }} />
    </header>
  );
}
