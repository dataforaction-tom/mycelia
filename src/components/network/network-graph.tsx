"use client";

import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import { CONNECTION_TYPE_COLORS, type ConnectionType } from "@/lib/config/theme";

interface NetworkNode {
  id: string;
  name: string;
  type: ConnectionType;
  clusterId: string;
}

interface NetworkEdge {
  id: string;
  source: string;
  target: string;
  strength: number;
  linkSource: string;
}

interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

type SimNode = NetworkNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { strength: number };

const WIDTH = 800;
const HEIGHT = 560;

export function NetworkGraph({ organisationId }: { organisationId: string }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    // Degree-weighted "strength" proxy: sum of incident edge strengths per node.
    const strengthById = new Map<string, number>();
    for (const n of data.nodes) strengthById.set(n.id, 0);
    for (const e of data.edges) {
      strengthById.set(e.source, (strengthById.get(e.source) ?? 0) + e.strength);
      strengthById.set(e.target, (strengthById.get(e.target) ?? 0) + e.strength);
    }

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(strengthById.values()) || 1])
      .range([6, 26]);

    const strokeWidthScale = d3.scaleLinear().domain([0, 1]).range([1, 5]);
    const strokeOpacityScale = d3.scaleLinear().domain([0, 1]).range([0.25, 0.85]);

    // Simulation mutates node/link objects in place — copy to avoid touching props.
    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      strength: e.strength,
    }));

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const linkGroup = svg.append("g").attr("stroke-linecap", "round");
    const nodeGroup = svg.append("g");
    const labelGroup = svg.append("g");

    const link = linkGroup
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#9c8b7a")
      .attr("stroke-width", (d) => strokeWidthScale(d.strength))
      .attr("stroke-opacity", (d) => strokeOpacityScale(d.strength));

    const node = nodeGroup
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", (d) => radiusScale(strengthById.get(d.id) ?? 0))
      .attr("fill", (d) => CONNECTION_TYPE_COLORS[d.type])
      .attr("stroke", "#faf6f1")
      .attr("stroke-width", 1.5);

    const label = labelGroup
      .selectAll("text")
      .data(nodes)
      .join("text")
      .text((d) => d.name)
      .attr("font-size", 10)
      .attr("fill", "#5c4332")
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -(radiusScale(strengthById.get(d.id) ?? 0) + 6));

    function paint() {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      node.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
      label.attr("x", (d) => d.x ?? 0).attr("y", (d) => d.y ?? 0);
    }

    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink<SimNode, SimLink>(links)
          .id((d) => d.id)
          .distance(80)
          .strength((d) => 0.1 + d.strength * 0.4)
      )
      .force("charge", d3.forceManyBody().strength(-180))
      .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collide",
        d3.forceCollide<SimNode>(
          (d) => radiusScale(strengthById.get(d.id) ?? 0) + 4
        )
      );

    // Static render: settle the layout synchronously, then paint once.
    // No drag/zoom/click interactivity — that belongs to a later task.
    simulation.tick(300);
    simulation.stop();
    paint();

    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-xl border border-border bg-white">
        <p className="text-sm text-muted">Loading network…</p>
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

  if (!data || data.nodes.length < 2 || data.edges.length === 0) {
    return (
      <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-white p-12 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-terracotta/10">
          <svg
            className="h-6 w-6 text-terracotta"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-bark">No network yet</h3>
        <p className="mt-2 max-w-sm text-sm text-muted">
          Add more connections and moments to start seeing relationships
          form.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-white p-4">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full"
        style={{ minWidth: WIDTH, height: HEIGHT }}
      />
    </div>
  );
}
