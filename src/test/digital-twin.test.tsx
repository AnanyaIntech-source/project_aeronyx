import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ReactNode } from "react";
import { COMPONENTS, getAircraft } from "@/lib/fleet/data";
import { componentHealth } from "@/lib/fleet/engine";
import { Story } from "@/components/homepage/Story";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
}));
vi.stubGlobal("IntersectionObserver", class {
  observe() {}
  unobserve() {}
  disconnect() {}
});
afterEach(cleanup);

describe("Homepage digital twin selection", () => {
  for (const { key, label } of COMPONENTS) {
    it(`${key} hotspot and selector display the same aircraft readings`, () => {
      const { container } = render(<Story />);
      const hotspot = screen.getByRole("button", { name: `Select ${label} on aircraft` });
      const selector = container.querySelector(".home-component-list");
      if (!selector) throw new Error("Missing component selector");
      const tab = within(selector as HTMLElement).getByRole("button", { name: new RegExp(label) });
      fireEvent.click(hotspot);
      expect(hotspot).toHaveAttribute("aria-pressed", "true");
      expect(tab).toHaveAttribute("aria-pressed", "true");
      const panel = screen.getByRole("region", { name: "Selected component readings" });
      const aircraft = getAircraft("AX-02");
      expect(within(panel).getByText(`${componentHealth(aircraft, key)}/100`)).toBeInTheDocument();
      for (const sensor of aircraft.sensors[key]) {
        expect(within(panel).getByText(`${sensor.value}${sensor.unit}`)).toBeInTheDocument();
      }
      const viaHotspot = panel.textContent;
      fireEvent.click(screen.getByRole("button", { name: `Select ${key === "engine" ? "Avionics" : "Engines"} on aircraft` }));
      fireEvent.click(tab);
      expect(panel.textContent).toBe(viaHotspot);
      expect(hotspot).toHaveAttribute("aria-pressed", "true");
    });
  }
});