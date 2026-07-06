import * as d3 from "d3";

/**
 * Shared "living network" helpers for the D3 canvases (Threads,
 * Constellations, and the dashboard ecosystem hero).
 *
 * Motion is attached as SVG <animate> elements (SMIL) so the browser runs
 * it declaratively — no per-frame JavaScript — and everything is skipped
 * entirely when the user prefers reduced motion.
 */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/** Soft bloom filter — the bioluminescence of the underground. */
export function addGlowFilter(
  svg: d3.Selection<SVGSVGElement, unknown, null, undefined>,
  id: string,
  stdDeviation: number
): void {
  const filter = svg
    .append("defs")
    .append("filter")
    .attr("id", id)
    .attr("x", "-80%")
    .attr("y", "-80%")
    .attr("width", "260%")
    .attr("height", "260%");
  filter
    .append("feGaussianBlur")
    .attr("stdDeviation", stdDeviation)
    .attr("result", "blur");
  const merge = filter.append("feMerge");
  merge.append("feMergeNode").attr("in", "blur");
  merge.append("feMergeNode").attr("in", "SourceGraphic");
}

// Vitality lives in its own d3-free module so server components can share
// it; re-exported here for the canvas components' convenience.
export { vitalityOf, VITALITY_OPACITY, type Vitality } from "./vitality";

/**
 * Attach a slow breathing animation to circles. Each node gets a slightly
 * different period so the organism never moves in lockstep.
 */
export function attachBreathing<Datum>(
  circles: d3.Selection<SVGCircleElement, Datum, SVGGElement, unknown>,
  radiusOf: (d: Datum) => number
): void {
  if (prefersReducedMotion()) return;
  circles.each(function (datum, index) {
    const radius = radiusOf(datum);
    d3.select(this)
      .append("animate")
      .attr("attributeName", "r")
      .attr("values", `${radius};${radius * 1.08};${radius}`)
      .attr("keyTimes", "0;0.5;1")
      .attr("calcMode", "spline")
      .attr("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1")
      .attr("dur", `${4 + (index % 5) * 0.8}s`)
      .attr("repeatCount", "indefinite");
  });
}

/** Attach a gentle opacity twinkle (for stars and fresh nodes). */
export function attachTwinkle<Datum>(
  circles: d3.Selection<SVGCircleElement, Datum, SVGGElement, unknown>,
  baseOpacityOf: (d: Datum) => number
): void {
  if (prefersReducedMotion()) return;
  circles.each(function (datum, index) {
    const base = baseOpacityOf(datum);
    d3.select(this)
      .append("animate")
      .attr("attributeName", "opacity")
      .attr("values", `${base};${Math.max(0.15, base * 0.45)};${base}`)
      .attr("keyTimes", "0;0.5;1")
      .attr("calcMode", "spline")
      .attr("keySplines", "0.4 0 0.6 1;0.4 0 0.6 1")
      .attr("dur", `${2.6 + ((index * 7) % 11) * 0.5}s`)
      .attr("begin", `${((index * 3) % 7) * 0.4}s`)
      .attr("repeatCount", "indefinite");
  });
}

/**
 * Pulses of light travelling along edges — nutrients moving through
 * hyphae. Draws an overlay line per link with an animated dash; the caller
 * positions the returned selection on every simulation tick alongside the
 * base links. Stronger links pulse faster.
 */
export function createFlowOverlay<LinkDatum extends { strength: number }>(
  group: d3.Selection<SVGGElement, unknown, null, undefined>,
  links: LinkDatum[],
  color: string
): d3.Selection<SVGLineElement, LinkDatum, SVGGElement, unknown> {
  const overlay = group
    .selectAll<SVGLineElement, LinkDatum>("line.flow")
    .data(links)
    .join<SVGLineElement>("line")
    .attr("class", "flow")
    .attr("stroke", color)
    .attr("stroke-width", 1.6)
    .attr("stroke-linecap", "round")
    .attr("stroke-dasharray", "2 22")
    .attr("stroke-opacity", (d) => 0.25 + d.strength * 0.5);

  if (!prefersReducedMotion()) {
    overlay.each(function (datum, index) {
      d3.select(this)
        .append("animate")
        .attr("attributeName", "stroke-dashoffset")
        .attr("from", "24")
        .attr("to", "0")
        .attr("dur", `${(2.8 - Math.min(datum.strength, 1) * 1.4).toFixed(2)}s`)
        .attr("begin", `${((index * 5) % 9) * 0.3}s`)
        .attr("repeatCount", "indefinite");
    });
  }

  return overlay;
}

/**
 * Idle alpha for the perpetual drift. Above d3's default alphaMin (0.001)
 * so the simulation never self-stops, low enough that motion stays
 * almost subliminal.
 */
export const IDLE_ALPHA_TARGET = 0.02;

/**
 * Keep a settled force simulation drifting almost imperceptibly so the
 * network reads as alive rather than pinned. No-op under reduced motion.
 * d3's internal timer uses requestAnimationFrame, so drifting pauses
 * automatically in background tabs.
 */
export function keepDrifting<NodeDatum extends d3.SimulationNodeDatum>(
  simulation: d3.Simulation<NodeDatum, undefined>
): void {
  if (prefersReducedMotion()) return;
  simulation
    .velocityDecay(0.7)
    .alphaTarget(IDLE_ALPHA_TARGET)
    .alpha(0.05)
    .restart();
}
