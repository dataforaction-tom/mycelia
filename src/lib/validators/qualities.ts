import { z } from "zod/v3";
import { SPECTRUM_KEYS } from "@/lib/config/qualities";

export const createQualitySchema = z.object({
  spectrum: z.enum(SPECTRUM_KEYS as [string, ...string[]]),
  position: z.number().min(-1).max(1),
});

export type CreateQualityInput = z.infer<typeof createQualitySchema>;
