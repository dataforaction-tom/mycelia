"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  prefersReducedMotion,
  vitalityOf,
  IDLE_ALPHA_TARGET,
  VITALITY_OPACITY,
} from "@/lib/network/living";
import { vitalityLabel } from "@/lib/network/vitality";
import { ToggleChip } from "@/components/ui/chip";
import { Filaments } from "./filaments";
import { Spores } from "./spores";

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

interface SelectedNode {
  id: string;
  name: string;
  type: ConnectionType;
  strength: number;
  lastMomentAt: string | null;
}

type SimNode = NetworkNode & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimNode> & { strength: number };

const WIDTH = 800;
const HEIGHT = 560;
const LABEL_ZOOM_THRESHOLD = 0.6;

type FilterMode = "all" | "people" | "organisations" | "quiet";

const FILTER_CHIPS: { key: FilterMode; label: string }[] = [
  { key: "all", label: "Everyone" },
  { key: "people", label: "People" },
  { key: "organisations", label: "Organisations" },
  { key: "quiet", label: "Going quiet" },
];

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
  const [selected, setSelected] = useState<SelectedNode | null>(null);

  // Prototype filter chips: one lens at a time. "Going quiet" surfaces the
  // threads that need tending (fading/dormant vitality).
  const [mode, setMode] = useState<FilterMode>("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Effect 1: fetch once per org — every filter is applied client-side.
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

  // Effect 2: D3 setup (simulation, zoom, drag, click, hover). Runs once
  // per fetched dataset — filtering (Effect 3) never re-runs this.
  useEffect(() => {
    if (!data || !svgRef.current || data.nodes.length === 0) return;

    const strengthById = new Map<string, number>();
    for (const n of data.nodes) strengthById.set(n.id, 0);
    for (const e of data.edges) {
      strengthById.set(
        e.source,
        (strengthById.get(e.source) ?? 0) + e.strength
      );
      strengthById.set(
        e.target,
        (strengthById.get(e.target) ?? 0) + e.strength
      );
    }
    strengthByIdRef.current = strengthById;

    const radiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(strengthById.values()) || 1])
      .range([6, 26]);

    const strokeWidthScale = d3.scaleLinear().domain([0, 1]).range([1, 4.5]);
    const strokeOpacityScale = d3
      .scaleLinear()
      .domain([0, 1])
      .range([0.14, 0.6]);

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
    const haloGroup = container.append("g");
    const nodeGroup = container.append("g").attr("filter", "url(#node-glow)");
    const labelGroup = container.append("g");

    // Threads per the prototype: cream dashes flowing along every join
    const link = linkGroup
      .selectAll<SVGLineElement, SimLink>("line")
      .data(links)
      .join<SVGLineElement>("line")
      .attr("stroke", UNDERGROUND.spore)
      .attr("stroke-width", (d) => strokeWidthScale(d.strength))
      .attr("stroke-opacity", (d) => strokeOpacityScale(d.strength));
    attachDashFlow(link);

    const nodeRadius = (d: SimNode) => radiusScale(strengthById.get(d.id) ?? 0);

    // Fresh relationships flare: an expanding, fading ring
    const freshNodes = nodes.filter(
      (n) => vitalityOf(n.lastMomentAt) === "fresh"
    );
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
    haloSelRef.current = halo;

    function paint() {
      link
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

    // Clicking a node opens its floating detail card (bottom-right); the
    // card itself navigates. Clicking the background clears the selection.
    node.on("click", (event, d) => {
      event.stopPropagation();
      setSelected({
        id: d.id,
        name: d.name,
        type: d.type,
        strength: strengthById.get(d.id) ?? 0,
        lastMomentAt: d.lastMomentAt,
      });
    });
    svg.on("click", () => setSelected(null));

    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
      zoomRef.current = null;
      nodeSelRef.current = null;
      linkSelRef.current = null;
      labelSelRef.current = null;
      haloSelRef.current = null;
      simNodesRef.current = null;
      strengthByIdRef.current = null;
      applyVisibilityRef.current = null;
      setSelected(null);
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
      if (mode === "people") return d.type === "person";
      if (mode === "organisations") return d.type !== "person";
      if (mode === "quiet") {
        const vitality = vitalityOf(d.lastMomentAt);
        return vitality === "fading" || vitality === "dormant";
      }
      return true;
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

    haloSelRef.current?.style("display", (d) =>
      nodeVisible(d) ? null : "none"
    );

    applyVisibilityRef.current = () => {
      labelSel.style("display", (d) =>
        nodeVisible(d) && zoomKRef.current >= LABEL_ZOOM_THRESHOLD
          ? null
          : "none"
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
  }, [mode, searchTerm, data]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="animate-glow bg-spore h-2 w-2 rounded-full" />
          <p className="text-soil-ink-soft text-sm">
            Listening for the network…
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-destructive/30 bg-destructive/10 text-destructive rounded-lg border p-3 text-sm">
        {error}
      </div>
    );
  }

  if (!data || data.nodes.length < 2 || data.edges.length === 0) {
    return (
      <div className="flex flex-col items-center p-12 text-center">
        <div
          className="relative mb-5 flex h-14 w-14 items-center justify-center"
          aria-hidden="true"
        >
          <span className="animate-breathe bg-spore/10 absolute inset-0 rounded-full" />
          <span className="animate-breathe bg-spore/20 absolute inset-3 rounded-full [animation-delay:700ms]" />
          <span className="bg-spore shadow-spore/60 relative h-3 w-3 rounded-full shadow-[0_0_16px]" />
        </div>
        <h3 className="font-display text-soil-ink text-xl">
          Nothing has surfaced yet
        </h3>
        <p className="text-soil-ink-soft mt-2 max-w-sm text-sm">
          The network draws itself from your moments. Record conversations that
          mention more than one connection, and threads will begin to form here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Find someone in the network"
          placeholder="Find someone…"
          className="border-soil-line text-soil-ink placeholder:text-soil-ink-soft/70 focus:border-spore/50 focus-visible:ring-spore/70 w-44 rounded-full border bg-transparent px-4 py-1.5 text-sm focus:outline-none focus-visible:ring-2"
        />
        <div
          role="radiogroup"
          aria-label="Filter the network by connection type"
          className="flex flex-wrap gap-2"
        >
          {FILTER_CHIPS.map((chip) => (
            <ToggleChip
              key={chip.key}
              role="radio"
              variant="dark"
              pressed={mode === chip.key}
              onPressedChange={() => setMode(chip.key)}
            >
              {chip.label}
            </ToggleChip>
          ))}
        </div>
      </div>

      {/* Text equivalent of the visual graph (WCAG 1.1.1 / 2.1.1): the SVG
          nodes aren't focusable, so this visually-hidden list gives keyboard
          and screen-reader users the same reach — every connection, its type
          and vitality, linking through to its story. */}
      <ul className="sr-only">
        {data.nodes.map((node) => (
          <li key={node.id}>
            <Link href={`/${orgSlug}/connections/${node.id}`}>
              {node.name} — {node.type}, {vitalityLabel(node.lastMomentAt)}
            </Link>
          </li>
        ))}
      </ul>

      <div className="relative overflow-x-auto">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full"
          style={{ minWidth: WIDTH, height: HEIGHT }}
          role="img"
          aria-label={`Network map of ${data.nodes.length} connections and ${data.edges.length} relationships. Brighter, closer nodes are warmer, stronger relationships; faded ones have gone quiet. The connections are also listed as links above.`}
        />
        <Filaments width={WIDTH} height={130} count={9} seed={23} />
        <Spores count={6} seed={23} />

        {selected && (
          <button
            type="button"
            onClick={() =>
              router.push(`/${orgSlug}/connections/${selected.id}`)
            }
            aria-label={`Read ${selected.name}'s story — ${selected.type}, ${vitalityLabel(
              selected.lastMomentAt
            )}`}
            className="border-soil-line bg-soil-raised absolute right-6 bottom-6 z-20 w-72 rounded-2xl border p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center gap-2.5">
              <span
                className="h-8 w-8 shrink-0 rounded-full"
                style={{
                  background: `radial-gradient(circle at 35% 30%, var(--node-tan), ${CONNECTION_TYPE_COLORS_GLOW[selected.type]})`,
                }}
              />
              <div className="min-w-0">
                <p className="text-soil-ink truncate text-sm font-semibold">
                  {selected.name}
                </p>
                <p className="text-soil-ink-soft truncate text-xs capitalize">
                  {selected.type} · strength {selected.strength.toFixed(1)}
                </p>
              </div>
            </div>
            <p className="text-soil-ink-soft mt-2.5 text-xs">
              {vitalityLabel(selected.lastMomentAt)}
            </p>
            <p className="text-spore mt-2.5 text-xs font-medium">
              Read the story →
            </p>
          </button>
        )}
      </div>
      <p className="text-soil-ink-soft/80 text-xs">
        Bright nodes have recent moments; fading ones are going quiet. Light
        pulses travel along your strongest threads, and fresh relationships
        ripple.
      </p>
    </div>
  );
}
