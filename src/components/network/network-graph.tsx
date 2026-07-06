"use client";

import { useEffect, useRef, useState } from "react";
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
  createFlowOverlay,
  keepDrifting,
  prefersReducedMotion,
  vitalityOf,
  IDLE_ALPHA_TARGET,
  VITALITY_OPACITY,
} from "@/lib/network/living";
import { NetworkControls } from "./network-controls";

interface NetworkNode {
  id: string;
  name: string;
  type: ConnectionType;
  clusterId: string;
  lastMomentAt: string | null;
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

interface Tooltip {
  x: number;
  y: number;
  name: string;
  type: ConnectionType;
  strength: number;
}

type SimNode = NetworkNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { strength: number };

const WIDTH = 800;
const HEIGHT = 560;
const ALL_TYPES: ConnectionType[] = [
  "person",
  "organisation",
  "group",
  "community",
];
const LABEL_ZOOM_THRESHOLD = 0.6;

export function NetworkGraph({
  organisationId,
  orgSlug,
}: {
  organisationId: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
  const nodeSelRef = useRef<d3.Selection<
    SVGCircleElement,
    SimNode,
    SVGGElement,
    unknown
  > | null>(null);
  const linkSelRef = useRef<d3.Selection<
    SVGLineElement,
    SimLink,
    SVGGElement,
    unknown
  > | null>(null);
  const labelSelRef = useRef<d3.Selection<
    SVGTextElement,
    SimNode,
    SVGGElement,
    unknown
  > | null>(null);
  const flowSelRef = useRef<d3.Selection<
    SVGLineElement,
    SimLink,
    SVGGElement,
    unknown
  > | null>(null);
  const haloSelRef = useRef<d3.Selection<
    SVGCircleElement,
    SimNode,
    SVGGElement,
    unknown
  > | null>(null);
  const simNodesRef = useRef<SimNode[] | null>(null);
  const strengthByIdRef = useRef<Map<string, number> | null>(null);
  const zoomKRef = useRef(1);
  const applyVisibilityRef = useRef<(() => void) | null>(null);

  const [data, setData] = useState<NetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);

  const [minStrength, setMinStrength] = useState(0);
  const [activeTypes, setActiveTypes] = useState<Set<ConnectionType>>(
    () => new Set(ALL_TYPES)
  );
  const [hideUnconnected, setHideUnconnected] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  function toggleType(type: ConnectionType) {
    setActiveTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }

  // Effect 1: fetch. Only organisationId/minStrength changes trigger a
  // refetch, since minStrength is the only filter the server applies.
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/network?minStrength=${minStrength}`, {
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
  }, [organisationId, minStrength]);

  // Effect 2: D3 setup (simulation, zoom, drag, click, hover). Runs once
  // per fetched dataset — filtering (Effect 3) never re-runs this.
  useEffect(() => {
    if (!data || !svgRef.current || data.nodes.length === 0) return;

    const strengthById = new Map<string, number>();
    for (const n of data.nodes) strengthById.set(n.id, 0);
    for (const e of data.edges) {
      strengthById.set(e.source, (strengthById.get(e.source) ?? 0) + e.strength);
      strengthById.set(e.target, (strengthById.get(e.target) ?? 0) + e.strength);
    }
    strengthByIdRef.current = strengthById;

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(strengthById.values()) || 1])
      .range([6, 26]);

    const strokeWidthScale = d3.scaleLinear().domain([0, 1]).range([1, 4.5]);
    const strokeOpacityScale = d3.scaleLinear().domain([0, 1]).range([0.14, 0.6]);

    const nodes: SimNode[] = data.nodes.map((n) => ({ ...n }));
    const links: SimLink[] = data.edges.map((e) => ({
      source: e.source,
      target: e.target,
      strength: e.strength,
    }));
    simNodesRef.current = nodes;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    // Soft bloom around every node — the bioluminescence of the underground
    addGlowFilter(svg, "node-glow", 3.5);

    const container = svg.append("g");
    const linkGroup = container.append("g").attr("stroke-linecap", "round");
    const flowGroup = container.append("g");
    const haloGroup = container.append("g");
    const nodeGroup = container.append("g").attr("filter", "url(#node-glow)");
    const labelGroup = container.append("g");

    const link = linkGroup
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .join<SVGLineElement>("line")
      .attr("stroke", UNDERGROUND.spore)
      .attr("stroke-width", (d) => strokeWidthScale(d.strength))
      .attr("stroke-opacity", (d) => strokeOpacityScale(d.strength));

    // Pulses of light travelling along the stronger threads
    const flow = createFlowOverlay(
      flowGroup,
      links.filter((l) => l.strength >= 0.35),
      UNDERGROUND.spore
    );

    const nodeRadius = (d: SimNode) =>
      radiusScale(strengthById.get(d.id) ?? 0);

    // Fresh relationships flare: an expanding, fading ring
    const freshNodes = nodes.filter((n) => vitalityOf(n.lastMomentAt) === "fresh");
    const halo = haloGroup
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(freshNodes)
      .join<SVGCircleElement>("circle")
      .attr("fill", "none")
      .attr("stroke", (d) => CONNECTION_TYPE_COLORS_GLOW[d.type])
      .attr("stroke-width", 1.2)
      .attr("r", (d) => nodeRadius(d) + 4)
      .attr("opacity", 0.5);
    if (!prefersReducedMotion()) {
      halo.each(function (datum, index) {
        const startR = nodeRadius(datum) + 3;
        const sel = d3.select(this);
        sel
          .append("animate")
          .attr("attributeName", "r")
          .attr("from", `${startR}`)
          .attr("to", `${startR + 14}`)
          .attr("dur", "3.2s")
          .attr("begin", `${(index % 4) * 0.8}s`)
          .attr("repeatCount", "indefinite");
        sel
          .append("animate")
          .attr("attributeName", "opacity")
          .attr("from", "0.55")
          .attr("to", "0")
          .attr("dur", "3.2s")
          .attr("begin", `${(index % 4) * 0.8}s`)
          .attr("repeatCount", "indefinite");
      });
    }

    const node = nodeGroup
      .selectAll<SVGCircleElement, SimNode>("circle")
      .data(nodes)
      .join<SVGCircleElement>("circle")
      .attr("r", nodeRadius)
      .attr("fill", (d) => CONNECTION_TYPE_COLORS_GLOW[d.type])
      // Vitality: quiet relationships literally fade toward the dark
      .attr("fill-opacity", (d) => VITALITY_OPACITY[vitalityOf(d.lastMomentAt)])
      .attr("stroke", UNDERGROUND.soil)
      .attr("stroke-width", 1.5)
      .style("cursor", "pointer");
    attachBreathing(node, nodeRadius);

    const label = labelGroup
      .selectAll<SVGTextElement, SimNode>("text")
      .data(nodes)
      .join<SVGTextElement>("text")
      .text((d) => d.name)
      .attr("font-size", 10)
      .attr("fill", UNDERGROUND.ink)
      .attr("opacity", (d) =>
        vitalityOf(d.lastMomentAt) === "dormant" ? 0.45 : 0.85
      )
      .attr("text-anchor", "middle")
      .attr("dy", (d) => -(radiusScale(strengthById.get(d.id) ?? 0) + 6));

    nodeSelRef.current = node;
    linkSelRef.current = link;
    labelSelRef.current = label;
    flowSelRef.current = flow;
    haloSelRef.current = halo;

    function paint() {
      link
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      flow
        .attr("x1", (d) => (d.source as SimNode).x ?? 0)
        .attr("y1", (d) => (d.source as SimNode).y ?? 0)
        .attr("x2", (d) => (d.target as SimNode).x ?? 0)
        .attr("y2", (d) => (d.target as SimNode).y ?? 0);
      halo.attr("cx", (d) => d.x ?? 0).attr("cy", (d) => d.y ?? 0);
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
      )
      .on("tick", paint);

    // Settle synchronously first so the layout appears instantly, then keep
    // the organism drifting almost imperceptibly (static if the user
    // prefers reduced motion — dragging still reheats via alphaTarget).
    simulation.tick(300);
    simulation.stop();
    paint();
    keepDrifting(simulation);
    const idleAlphaTarget = prefersReducedMotion() ? 0 : IDLE_ALPHA_TARGET;

    // Pan/zoom the whole graph. Label visibility is re-applied on zoom via
    // applyVisibilityRef so filter state (set by Effect 3) is respected.
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 6])
      .on("zoom", (event) => {
        container.attr("transform", event.transform.toString());
        zoomKRef.current = event.transform.k;
        applyVisibilityRef.current?.();
      });
    svg.call(zoom);
    zoomRef.current = zoom;

    // Drag to reposition. Pin released on drag end — the layout is meant
    // for exploring, not manually arranging (no saved-position feature).
    const drag = d3
      .drag<SVGCircleElement, SimNode>()
      .on("start", (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on("drag", (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on("end", (event, d) => {
        if (!event.active) simulation.alphaTarget(idleAlphaTarget);
        d.fx = null;
        d.fy = null;
      });
    node.call(drag);

    node.on("click", (event, d) => {
      event.stopPropagation();
      router.push(`/${orgSlug}/connections/${d.id}`);
    });

    node
      .on("mouseenter", (event, d) => {
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          name: d.name,
          type: d.type,
          strength: strengthById.get(d.id) ?? 0,
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
      zoomRef.current = null;
      nodeSelRef.current = null;
      linkSelRef.current = null;
      labelSelRef.current = null;
      flowSelRef.current = null;
      haloSelRef.current = null;
      simNodesRef.current = null;
      strengthByIdRef.current = null;
      applyVisibilityRef.current = null;
      setTooltip(null);
    };
  }, [data, orgSlug, router]);

  // Effect 3: filter/search overlay. Only toggles display/highlight on
  // already-rendered elements — never restarts the simulation, so the
  // user's current pan/zoom and any dragged node positions are preserved.
  useEffect(() => {
    const nodeSel = nodeSelRef.current;
    const linkSel = linkSelRef.current;
    const labelSel = labelSelRef.current;
    const nodes = simNodesRef.current;
    const strengthById = strengthByIdRef.current;
    if (!nodeSel || !linkSel || !labelSel || !nodes || !strengthById) return;

    function nodeVisible(d: SimNode) {
      const connected = (strengthById!.get(d.id) ?? 0) > 0;
      return activeTypes.has(d.type) && (!hideUnconnected || connected);
    }

    const term = searchTerm.trim().toLowerCase();
    const matched = term
      ? nodes.find((n) => n.name.toLowerCase().includes(term))
      : undefined;

    nodeSel
      .style("display", (d) => (nodeVisible(d) ? null : "none"))
      .attr("stroke", (d) =>
        matched && d.id === matched.id ? "#ffffff" : UNDERGROUND.soil
      )
      .attr("stroke-width", (d) => (matched && d.id === matched.id ? 3 : 1.5));

    linkSel.style("display", (d) => {
      const source = d.source as SimNode;
      const target = d.target as SimNode;
      return nodeVisible(source) && nodeVisible(target) ? null : "none";
    });

    flowSelRef.current?.style("display", (d) => {
      const source = d.source as SimNode;
      const target = d.target as SimNode;
      return nodeVisible(source) && nodeVisible(target) ? null : "none";
    });
    haloSelRef.current?.style("display", (d) =>
      nodeVisible(d) ? null : "none"
    );

    applyVisibilityRef.current = () => {
      labelSel.style("display", (d) =>
        nodeVisible(d) && zoomKRef.current >= LABEL_ZOOM_THRESHOLD ? null : "none"
      );
    };
    applyVisibilityRef.current();

    if (matched && zoomRef.current && svgRef.current) {
      const svg = d3.select(svgRef.current);
      const transform = d3.zoomIdentity
        .translate(WIDTH / 2, HEIGHT / 2)
        .scale(2)
        .translate(-(matched.x ?? 0), -(matched.y ?? 0));
      svg.transition().duration(500).call(zoomRef.current.transform, transform);
    }
  }, [activeTypes, hideUnconnected, searchTerm, data]);

  if (isLoading) {
    return (
      <div className="underground flex h-96 items-center justify-center rounded-2xl border border-soil-line">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 animate-glow rounded-full bg-spore" />
          <p className="text-sm text-soil-ink-soft">
            Listening for the network…
          </p>
        </div>
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
      <div className="underground flex flex-col items-center rounded-2xl border border-soil-line p-12 text-center">
        <div
          className="relative mb-5 flex h-14 w-14 items-center justify-center"
          aria-hidden="true"
        >
          <span className="absolute inset-0 animate-breathe rounded-full bg-spore/10" />
          <span className="absolute inset-3 animate-breathe rounded-full bg-spore/20 [animation-delay:700ms]" />
          <span className="relative h-3 w-3 rounded-full bg-spore shadow-[0_0_16px] shadow-spore/60" />
        </div>
        <h3 className="font-display text-xl text-soil-ink">
          Nothing has surfaced yet
        </h3>
        <p className="mt-2 max-w-sm text-sm text-soil-ink-soft">
          The network draws itself from your moments. Record conversations
          that mention more than one connection, and threads will begin to
          form here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <NetworkControls
        activeTypes={activeTypes}
        onToggleType={toggleType}
        minStrength={minStrength}
        onMinStrengthChange={setMinStrength}
        hideUnconnected={hideUnconnected}
        onHideUnconnectedChange={setHideUnconnected}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      <div className="underground overflow-x-auto rounded-2xl border border-soil-line shadow-lift">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ minWidth: WIDTH, height: HEIGHT }}
        />
      </div>
      <p className="text-xs text-muted">
        Bright nodes have recent moments; fading ones are going quiet. Light
        pulses travel along your strongest threads, and fresh relationships
        ripple.
      </p>

      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded-lg border border-soil-line bg-soil-raised px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="font-semibold text-soil-ink">{tooltip.name}</p>
          <p className="mt-0.5 capitalize text-soil-ink-soft">
            {tooltip.type} · strength {tooltip.strength.toFixed(1)}
          </p>
        </div>
      )}
    </div>
  );
}
