"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { buildConstellation } from "@/lib/network/constellation";

interface NetworkNode {
  id: string;
  name: string;
  clusterId: string;
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
  memberNames: string[];
  memberCount: number;
}

type SimCluster = { id: string; memberCount: number; activity: number } & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimCluster> & { strength: number };

const WIDTH = 800;
const HEIGHT = 560;
const MAX_TOOLTIP_NAMES = 5;

export function ConstellationView({ organisationId }: { organisationId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/network", {
          headers: { "x-organisation-id": organisationId },
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error ?? "Failed to load network");
        }
        if (!cancelled) setData(json.data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load network");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [organisationId]);

  useEffect(() => {
    if (!data || !svgRef.current || data.nodes.length === 0) return;

    const { clusters, links: constellationLinks } = buildConstellation(
      data.nodes,
      data.edges
    );

    const namesByCluster = new Map<string, string[]>();
    for (const node of data.nodes) {
      const names = namesByCluster.get(node.clusterId);
      if (names) names.push(node.name);
      else namesByCluster.set(node.clusterId, [node.name]);
    }

    const radiusScale = d3
      .scaleSqrt()
      .domain([1, d3.max(clusters, (c) => c.memberCount) || 1])
      .range([10, 40]);

    const maxActivity = d3.max(clusters, (c) => c.activity) || 1;
    const opacityScale = d3.scaleLinear().domain([0, maxActivity]).range([0.4, 1]);
    const strokeWidthScale = d3
      .scaleLinear()
      .domain([0, d3.max(constellationLinks, (l) => l.strength) || 1])
      .range([1, 4]);

    const nodes: SimCluster[] = clusters.map((c) => ({ ...c }));
    const links: SimLink[] = constellationLinks.map((l) => ({
      source: l.source,
      target: l.target,
      strength: l.strength,
    }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const linkGroup = svg.append("g");
    const nodeGroup = svg.append("g");

    const link = linkGroup
      .selectAll<SVGPathElement, SimLink>("path")
      .data(links)
      .join<SVGPathElement>("path")
      .attr("fill", "none")
      .attr("stroke", "#8a6bb5")
      .attr("stroke-width", (d) => strokeWidthScale(d.strength))
      .attr("stroke-opacity", 0.5);

    const node = nodeGroup
      .selectAll<SVGCircleElement, SimCluster>("circle")
      .data(nodes)
      .join<SVGCircleElement>("circle")
      .attr("r", (d) => radiusScale(d.memberCount))
      .attr("fill", "#6b8f5e")
      .attr("fill-opacity", (d) => opacityScale(d.activity))
      .attr("stroke", "#4e6d43")
      .attr("stroke-width", 1.5);

    function paint() {
      link.attr("d", (d) => {
        const source = d.source as SimCluster;
        const target = d.target as SimCluster;
        const sx = source.x ?? 0;
        const sy = source.y ?? 0;
        const tx = target.x ?? 0;
        const ty = target.y ?? 0;
        const dx = tx - sx;
        const dy = ty - sy;
        const dr = Math.sqrt(dx * dx + dy * dy) * 1.3;
        return `M${sx},${sy}A${dr},${dr} 0 0,1 ${tx},${ty}`;
      });
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
    }

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<SimCluster, SimLink>(links)
          .id((d) => d.id)
          .distance(140)
      )
      .force("charge", d3.forceManyBody().strength(-260))
      .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collide",
        d3.forceCollide<SimCluster>((d) => radiusScale(d.memberCount) + 8)
      );

    simulation.tick(300);
    simulation.stop();
    paint();

    node
      .on("mouseenter", (event, d) => {
        const names = namesByCluster.get(d.id) ?? [];
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          memberNames: names.slice(0, MAX_TOOLTIP_NAMES),
          memberCount: names.length,
        });
      })
      .on("mousemove", (event) => {
        setTooltip((t) =>
          t ? { ...t, x: event.clientX, y: event.clientY } : t
        );
      })
      .on("mouseleave", () => setTooltip(null));

    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
      setTooltip(null);
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-white">
        <p className="text-sm text-muted">Loading constellations…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!data || data.nodes.length < 2) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-white p-12 text-center">
        <h3 className="text-lg font-semibold text-bark">No clusters yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Add more connections and moments to start seeing clusters form.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto rounded-xl border border-border bg-white p-4">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ minWidth: WIDTH, height: HEIGHT }}
        />
      </div>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-border bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="font-semibold text-bark">
            {tooltip.memberCount}{" "}
            {tooltip.memberCount === 1 ? "connection" : "connections"}
          </p>
          <p className="mt-0.5 text-muted">
            {tooltip.memberNames.join(", ")}
            {tooltip.memberCount > tooltip.memberNames.length &&
              ` +${tooltip.memberCount - tooltip.memberNames.length} more`}
          </p>
        </div>
      )}
    </div>
  );
}
