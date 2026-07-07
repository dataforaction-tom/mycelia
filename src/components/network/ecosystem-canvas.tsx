"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as d3 from "d3";
import {
  CONNECTION_TYPE_COLORS_GLOW,
  UNDERGROUND,
  type ConnectionType,
} from "@/lib/config/theme";
import {
  addGlowFilter,
  attachBreathing,
  attachDashFlow,
  keepDrifting,
  vitalityOf,
  VITALITY_OPACITY,
} from "@/lib/network/living";
import { Filaments } from "@/components/network/filaments";
import { Spores } from "@/components/network/spores";

interface NetworkNode {
  id: string;
  name: string;
  type: ConnectionType;
  clusterId: string;
  lastMomentAt: string | null;
}

interface NetworkEdge {
  source: string;
  target: string;
  strength: number;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface Tooltip {
  x: number;
  y: number;
  name: string;
  type: ConnectionType;
}

type SimNode = NetworkNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { strength: number };

const WIDTH = 900;
const HEIGHT = 430;

/**
 * The dashboard hero: the organisation's living network, breathing behind
 * the day's pulse. Not a chart on a page — the page opens into the
 * underground, and every node is a door to its connection.
 */
export function EcosystemCanvas({
  organisationId,
  orgSlug,
  headline,
  detail,
  stats,
}: {
  organisationId: string;
  orgSlug: string;
  headline: string;
  detail: string;
  stats: { connections: number; moments: number; thisWeek: number };
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/network", {
          headers: { "x-organisation-id": organisationId },
        });
        const json = await res.json();
        if (res.ok && json.success && !cancelled) setData(json.data);
      } catch {
        // The overlay still tells the day's story if the canvas can't load
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  useEffect(() => {
    if (!data || !svgRef.current || data.nodes.length === 0) return;

    const strengthById = new Map<string, number>();
    for (const n of data.nodes) strengthById.set(n.id, 0);
    for (const e of data.edges) {
      strengthById.set(e.source, (strengthById.get(e.source) ?? 0) + e.strength);
      strengthById.set(e.target, (strengthById.get(e.target) ?? 0) + e.strength);
    }

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(strengthById.values()) || 1])
      .range([4, 16]);
    const strokeWidthScale = d3.scaleLinear().domain([0, 1]).range([0.8, 3]);
    const strokeOpacityScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0.12, 0.5]);

    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      strength: e.strength,
    }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    addGlowFilter(svg, "eco-glow", 3);

    const linkGroup = svg.append("g").attr("stroke-linecap", "round");
    const nodeGroup = svg.append("g").attr("filter", "url(#eco-glow)");

    // Threads per the prototype: cream dashes flowing along every join
    const link = linkGroup
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .join("line")
      .attr("stroke", UNDERGROUND.spore)
      .attr("stroke-width", (d) => strokeWidthScale(d.strength))
      .attr("stroke-opacity", (d) => strokeOpacityScale(d.strength));
    attachDashFlow(link);

    const nodeRadius = (d: SimNode) => radiusScale(strengthById.get(d.id) ?? 0);
    const node = nodeGroup
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(nodes)
      .join("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) => CONNECTION_TYPE_COLORS_GLOW[d.type])
      .attr("fill-opacity", (d) => VITALITY_OPACITY[vitalityOf(d.lastMomentAt)])
      .attr("stroke", UNDERGROUND.soil)
      .attr("stroke-width", 1.2)
      .style("cursor", "pointer");
    attachBreathing(node, nodeRadius);

    function paint() {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
    }

    // Centre the organism right of the overlay text
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(64)
          .strength((d) => 0.1 + d.strength * 0.4)
      )
      .force("charge", d3.forceManyBody().strength(-130))
      .force("center", d3.forceCenter(WIDTH * 0.62, HEIGHT / 2))
      .force(
        "collide",
        d3.forceCollide<SimNode>((d) => nodeRadius(d) + 4)
      )
      .on("tick", paint);

    simulation.tick(300);
    simulation.stop();
    paint();
    keepDrifting(simulation);

    node
      .on("click", (event, d) => {
        event.stopPropagation();
        router.push(`/${orgSlug}/connections/${d.id}`);
      })
      .on("mouseenter", (event, d) => {
        setTooltip({ x: event.clientX, y: event.clientY, name: d.name, type: d.type });
      })
      .on("mousemove", (event) => {
        setTooltip((t) => (t ? { ...t, x: event.clientX, y: event.clientY } : t));
      })
      .on("mouseleave", () => setTooltip(null));

    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
      setTooltip(null);
    };
  }, [data, orgSlug, router]);

  return (
    // The whole card is a door into the network; node clicks (which stop
    // propagation) open their own connection instead.
    <section
      onClick={() => router.push(`/${orgSlug}/network`)}
      className="underground relative cursor-pointer overflow-hidden rounded-2xl border border-soil-line shadow-lift"
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
        aria-hidden="true"
      />
      {/* Scrim keeps the words legible without caging the organism */}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-soil/90 via-soil/40 to-transparent"
        aria-hidden="true"
      />
      <Filaments width={WIDTH} height={110} count={7} seed={11} />
      <Spores count={4} seed={11} />

      <div className="pointer-events-none relative flex min-h-[22rem] flex-col justify-between p-6 sm:p-8">
        <div className="max-w-md">
          <h2 className="font-display text-3xl text-soil-ink">{headline}</h2>
          <p className="mt-2 text-sm text-soil-ink-soft">{detail}</p>
        </div>

        <div className="flex flex-wrap items-end justify-between gap-6">
          <dl className="flex gap-8">
            <div>
              <dd className="font-display text-3xl text-soil-ink">
                {stats.connections}
              </dd>
              <dt className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-soil-ink-soft">
                Connections
              </dt>
            </div>
            <div>
              <dd className="font-display text-3xl text-soil-ink">
                {stats.moments}
              </dd>
              <dt className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-soil-ink-soft">
                Moments
              </dt>
            </div>
            <div>
              <dd className="font-display text-3xl text-soil-ink">
                {stats.thisWeek}
              </dd>
              <dt className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-soil-ink-soft">
                This week
              </dt>
            </div>
          </dl>
          <Link
            href={`/${orgSlug}/network`}
            className="pointer-events-auto rounded-lg border border-spore/40 px-4 py-2 text-sm font-medium text-spore transition-colors hover:bg-spore/10"
          >
            Open the network →
          </Link>
        </div>
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-soil-line bg-soil-raised px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="font-semibold text-soil-ink">{tooltip.name}</p>
          <p className="mt-0.5 capitalize text-soil-ink-soft">
            {tooltip.type} · click to open
          </p>
        </div>
      )}
    </section>
  );
}
