export const QUALITY_SPECTRUMS = {
  depth: { label: "Depth", low: "Cooling", high: "Deepening" },
  reciprocity: {
    label: "Reciprocity",
    low: "One-directional",
    high: "Reciprocal",
  },
  formality: { label: "Formality", low: "Formal", high: "Trust-based" },
  activity: { label: "Activity", low: "Dormant", high: "Active" },
  maturity: { label: "Maturity", low: "Emerging", high: "Established" },
} as const;

export type SpectrumKey = keyof typeof QUALITY_SPECTRUMS;
export const SPECTRUM_KEYS = Object.keys(
  QUALITY_SPECTRUMS
) as SpectrumKey[];
