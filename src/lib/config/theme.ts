export const CONNECTION_TYPE_COLORS = {
  person: "#6ba3be", // sky
  organisation: "#c2683b", // terracotta
  group: "#66845a", // moss
  community: "#d0912f", // amber
} as const;

// Bioluminescent variants for the underground (dark-canvas) network views —
// same hue families, lifted for luminosity against deep soil. SVG can't read
// CSS variables, so these are mirrored from globals.css by hand.
export const CONNECTION_TYPE_COLORS_GLOW = {
  person: "#8ec9e8",
  organisation: "#f0a875",
  group: "#a8dfc2",
  community: "#e8c97d",
} as const;

export const UNDERGROUND = {
  soil: "#141009",
  soilRaised: "#1f1811",
  soilLine: "#322718",
  spore: "#e8c97d",
  hypha: "#a8dfc2",
  ink: "#ede4d3",
  inkSoft: "#a3937a",
} as const;

export type ConnectionType = keyof typeof CONNECTION_TYPE_COLORS;
