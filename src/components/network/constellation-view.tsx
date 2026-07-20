"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as d3 from "d3";
import { buildConstellation } from "@/lib/network/constellation";
import {
  CONNECTION_TYPE_COLORS_GLOW,
  UNDERGROUND,
  type ConnectionType,
} from "@/lib/config/theme";
import {
  addGlowFilter,
  attachTwinkle,
  vitalityOf,
  VITALITY_OPACITY,
} from "@/lib/network/living";
import { vitalityLabel } from "@/lib/network/vitality";
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
  title: string;
  detail: string;
}

interface SelectedStar {
  id: string;
  name: string;
  type: ConnectionType;
  strength: number;
  lastMomentAt: string | null;
}

interface Star {
  node: NetworkNode;
  x: number;
  y: number;
  strength: number;
}

type SimCluster = {
  id: string;
  memberCount: number;
  activity: number;
  hullRadius: number;
} & d3.SimulationNodeDatum;
type SimLink = d3.SimulationLinkDatum<SimCluster> & { strength: number };

const WIDTH = 800;
const HEIGHT = 560;
// Golden angle: lays member stars out in a natural spiral inside each hull
const GOLDEN_ANGLE = 2.399963229728653;

export function ConstellationView({
  organisationId,
  orgSlug,
}: {
  organisationId: string;
  orgSlug: string;
}) {
  const router = useRouter();
  const svgRef = useRef<SVGSVGElement>(null);
  const [data, setData] = useState<NetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [selected, setSelected] = useState<SelectedStar | null>(null);

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
    const nodeById = new Map(data.nodes.map((n) => [n.id, n]));

    // Per-connection strength (summed edges) sizes stars and decides which
    // member anchors the cluster's name
    const strengthById = new Map<string, number>();
    for (const edge of data.edges) {
      strengthById.set(
        edge.source,
        (strengthById.get(edge.source) ?? 0) + edge.strength
      );
      strengthById.set(
        edge.target,
        (strengthById.get(edge.target) ?? 0) + edge.strength
      );
    }

    const hullRadiusScale = d3
      .scaleSqrt()
      .domain([1, d3.max(clusters, (c) => c.memberCount) || 1])
      .range([26, 88]);
    const starRadiusScale = d3
      .scaleSqrt()
      .domain([0, d3.max(strengthById.values()) || 1])
      .range([2.5, 6.5]);
    const arcWidthScale = d3
      .scaleLinear()
      .domain([0, d3.max(constellationLinks, (l) => l.strength) || 1])
      .range([1, 4]);

    const simClusters: SimCluster[] = clusters.map((c) => ({
      ...c,
      hullRadius: hullRadiusScale(c.memberCount),
    }));
    const simLinks: SimLink[] = constellationLinks.map((l) => ({
      source: l.source,
      target: l.target,
      strength: l.strength,
    }));

    // Position the constellations, then freeze — the life is in the stars
    const simulation = d3
      .forceSimulation(simClusters)
      .force(
        "link",
        d3
          .forceLink<SimCluster, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(220)
      )
      .force("charge", d3.forceManyBody().strength(-420))
      .force("center", d3.forceCenter(WIDTH / 2, HEIGHT / 2))
      .force(
        "collide",
        d3.forceCollide<SimCluster>((d) => d.hullRadius + 34)
      );
    simulation.tick(300);
    simulation.stop();

    // Keep every constellation (hull + label) fully inside the canvas
    for (const cluster of simClusters) {
      const pad = cluster.hullRadius + 20;
      cluster.x = Math.max(pad, Math.min(WIDTH - pad, cluster.x ?? WIDTH / 2));
      cluster.y = Math.max(
        pad,
        Math.min(HEIGHT - pad - 26, cluster.y ?? HEIGHT / 2)
      );
    }

    // Lay member stars out inside each hull: brightest at the heart,
    // the rest spiralling outward
    const stars: Star[] = [];
    const starByNodeId = new Map<string, Star>();
    for (const cluster of simClusters) {
      const cx = cluster.x ?? 0;
      const cy = cluster.y ?? 0;
      const members = clusters
        .find((c) => c.id === cluster.id)!
        .memberIds.map((id) => nodeById.get(id))
        .filter((n): n is NetworkNode => Boolean(n))
        .sort(
          (a, b) =>
            (strengthById.get(b.id) ?? 0) - (strengthById.get(a.id) ?? 0)
        );
      members.forEach((member, index) => {
        const spread =
          members.length > 1
            ? cluster.hullRadius * 0.8 * Math.sqrt(index / (members.length - 1))
            : 0;
        const angle = index * GOLDEN_ANGLE;
        const star: Star = {
          node: member,
          x: cx + spread * Math.cos(angle),
          y: cy + spread * Math.sin(angle),
          strength: strengthById.get(member.id) ?? 0,
        };
        stars.push(star);
        starByNodeId.set(member.id, star);
      });
    }

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    addGlowFilter(svg, "star-glow", 2.5);

    const hullGroup = svg.append("g");
    const arcGroup = svg.append("g");
    const intraGroup = svg.append("g");
    const starGroup = svg.append("g").attr("filter", "url(#star-glow)");
    const labelGroup = svg.append("g");

    // Faint hulls: the colony's soft boundary in the soil
    hullGroup
      .selectAll<SVGCircleElement, SimCluster>("circle")
      .data(simClusters)
      .join("circle")
      .attr("cx", (d) => d.x ?? 0)
      .attr("cy", (d) => d.y ?? 0)
      .attr("r", (d) => d.hullRadius + 14)
      .attr("fill", UNDERGROUND.hypha)
      .attr("fill-opacity", 0.05)
      .attr("stroke", UNDERGROUND.hypha)
      .attr("stroke-opacity", 0.18)
      .attr("stroke-dasharray", "2 7")
      .attr("stroke-linecap", "round")
      .on("mouseenter", (event, d) => {
        const names = clusters
          .find((c) => c.id === d.id)!
          .memberIds.map((id) => nodeById.get(id)?.name)
          .filter(Boolean)
          .slice(0, 6);
        setTooltip({
          x: event.clientX,
          y: event.clientY,
          title: `${d.memberCount} ${d.memberCount === 1 ? "connection" : "connections"}`,
          detail:
            names.join(", ") +
            (d.memberCount > names.length
              ? ` +${d.memberCount - names.length} more`
              : ""),
        });
      })
      .on("mousemove", (event) => {
        setTooltip((t) =>
          t ? { ...t, x: event.clientX, y: event.clientY } : t
        );
      })
      .on("mouseleave", () => setTooltip(null));

    // Dotted spore-trail arcs between constellations
    arcGroup
      .selectAll<SVGPathElement, SimLink>("path")
      .data(simLinks)
      .join("path")
      .attr("fill", "none")
      .attr("stroke", UNDERGROUND.spore)
      .attr("stroke-width", (d) => arcWidthScale(d.strength))
      .attr("stroke-opacity", 0.35)
      .attr("stroke-dasharray", "1 6")
      .attr("stroke-linecap", "round")
      .attr("d", (d) => {
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

    // The constellation lines: real relationships between member stars
    const intraEdges = data.edges.filter((edge) => {
      const source = nodeById.get(edge.source);
      const target = nodeById.get(edge.target);
      return (
        source &&
        target &&
        source.clusterId === target.clusterId &&
        starByNodeId.has(edge.source) &&
        starByNodeId.has(edge.target)
      );
    });
    intraGroup
      .selectAll<SVGLineElement, NetworkEdge>("line")
      .data(intraEdges)
      .join("line")
      .attr("x1", (d) => starByNodeId.get(d.source)!.x)
      .attr("y1", (d) => starByNodeId.get(d.source)!.y)
      .attr("x2", (d) => starByNodeId.get(d.target)!.x)
      .attr("y2", (d) => starByNodeId.get(d.target)!.y)
      .attr("stroke", UNDERGROUND.hypha)
      .attr("stroke-width", 0.8)
      .attr("stroke-opacity", (d) => 0.15 + d.strength * 0.3);

    // The stars themselves: typed colour, vitality brightness, twinkle,
    // click to open the connection
    const starSel = starGroup
      .selectAll<SVGCircleElement, Star>("circle")
      .data(stars)
      .join("circle")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => starRadiusScale(d.strength))
      .attr("fill", (d) => CONNECTION_TYPE_COLORS_GLOW[d.node.type])
      .attr("opacity", (d) => VITALITY_OPACITY[vitalityOf(d.node.lastMomentAt)])
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelected({
          id: d.node.id,
          name: d.node.name,
          type: d.node.type,
          strength: d.strength,
          lastMomentAt: d.node.lastMomentAt,
        });
      });
    attachTwinkle(
      starSel,
      (d) => VITALITY_OPACITY[vitalityOf(d.node.lastMomentAt)]
    );

    // Name each constellation after its brightest star
    labelGroup
      .selectAll<SVGTextElement, SimCluster>("text")
      .data(simClusters)
      .join("text")
      .attr("x", (d) => d.x ?? 0)
      .attr("y", (d) => (d.y ?? 0) + d.hullRadius + 30)
      .attr("text-anchor", "middle")
      .attr("font-size", 12)
      .attr("fill", UNDERGROUND.ink)
      .attr("opacity", 0.9)
      .text((d) => {
        const members = clusters
          .find((c) => c.id === d.id)!
          .memberIds.map((id) => nodeById.get(id))
          .filter((n): n is NetworkNode => Boolean(n))
          .sort(
            (a, b) =>
              (strengthById.get(b.id) ?? 0) - (strengthById.get(a.id) ?? 0)
          );
        const anchor = members[0]?.name ?? "Unnamed";
        return members.length > 1
          ? `${anchor} & ${members.length - 1} ${members.length === 2 ? "other" : "others"}`
          : anchor;
      });

    svg.on("click", () => setSelected(null));

    return () => {
      simulation.stop();
      svg.selectAll("*").remove();
      setTooltip(null);
      setSelected(null);
    };
  }, [data, orgSlug, router]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3">
          <span className="animate-glow bg-hypha h-2 w-2 rounded-full" />
          <p className="text-soil-ink-soft text-sm">
            Watching for constellations…
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

  if (!data || data.nodes.length < 2) {
    return (
      <div className="flex flex-col items-center p-12 text-center">
        <h3 className="font-display text-soil-ink text-xl">
          No constellations yet
        </h3>
        <p className="text-soil-ink-soft mt-2 max-w-sm text-sm">
          Clusters appear when groups of connections keep showing up in the same
          moments. Keep recording, and shapes will emerge.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Text equivalent of the constellation (WCAG 1.1.1 / 2.1.1) — the same
          connections as keyboard-navigable links for non-visual access. */}
      <ul className="sr-only">
        {data.nodes.map((node) => (
          <li key={node.id}>
            <Link href={`/${orgSlug}/connections/${node.id}`}>
              {node.name} — {node.type}, {vitalityLabel(node.lastMomentAt)}
            </Link>
          </li>
        ))}
      </ul>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="h-[420px] w-full sm:h-[560px]"
          role="img"
          aria-label={`Constellation map of ${data.nodes.length} connections grouped into clusters. The connections are also listed as links above.`}
        />
        <Filaments width={WIDTH} height={130} count={9} seed={41} />
        <Spores count={6} seed={41} />

        {selected && (
          <button
            type="button"
            onClick={() =>
              router.push(`/${orgSlug}/connections/${selected.id}`)
            }
            aria-label={`Read ${selected.name}'s story — ${selected.type}, ${vitalityLabel(
              selected.lastMomentAt
            )}`}
            className="border-soil-line bg-soil-raised absolute right-6 bottom-6 z-20 w-72 max-w-[calc(100%-3rem)] rounded-2xl border p-5 text-left shadow-[0_12px_40px_rgba(0,0,0,0.4)] backdrop-blur transition-transform hover:-translate-y-0.5"
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
      <p className="text-soil-ink-soft/80 mt-4 text-xs">
        Each constellation is a group of connections that keep appearing in the
        same moments, named after its brightest member. Click any star to see
        its details.
      </p>

      {tooltip && (
        <div
          className="border-soil-line bg-soil-raised pointer-events-none fixed z-50 max-w-xs rounded-lg border px-3 py-2 text-xs shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y + 12 }}
        >
          <p className="text-soil-ink font-semibold">{tooltip.title}</p>
          <p className="text-soil-ink-soft mt-0.5 capitalize">
            {tooltip.detail}
          </p>
        </div>
      )}
    </div>
  );
}
