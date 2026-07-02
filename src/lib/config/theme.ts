export const CONNECTION_TYPE_COLORS = {
  person: "#6ba3be", // sky
  organisation: "#c67a4a", // terracotta
  group: "#6b8f5e", // moss
  community: "#d4953a", // amber
} as const;

export type ConnectionType = keyof typeof CONNECTION_TYPE_COLORS;
