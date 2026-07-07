// The prototype's palette has no blue anywhere — people are moss, the
// whole system stays in earth tones.
export const CONNECTION_TYPE_COLORS = {
  person: "#8a9a56", // moss
  organisation: "#c97b47", // terracotta/rust
  group: "#6f9a4f", // green
  community: "#c9962e", // ochre
} as const;

// Bioluminescent variants for the underground (dark-canvas) network views —
// the prototype's node colours: cream, moss, tan/clay, ochre. SVG can't read
// CSS variables, so these are mirrored from globals.css by hand.
export const CONNECTION_TYPE_COLORS_GLOW = {
  person: "#e8d5a3", // cream — people glow brightest
  organisation: "#cd8b57", // clay
  group: "#adb878", // moss
  community: "#c9ad6e", // ochre
} as const;

export const UNDERGROUND = {
  soil: "#1b130a",
  soilMid: "#271d11",
  soilLight: "#3d2f1f",
  soilRaised: "rgba(41, 30, 18, 0.85)",
  soilLine: "rgba(232, 213, 163, 0.25)",
  spore: "#e8d5a3",
  hypha: "#adb878",
  nodeTan: "#c4a184",
  nodeClay: "#cd8b57",
  nodeOchre: "#c9ad6e",
  ink: "#f0eedd",
  inkSoft: "#bfad8e",
} as const;

export type ConnectionType = keyof typeof CONNECTION_TYPE_COLORS;
