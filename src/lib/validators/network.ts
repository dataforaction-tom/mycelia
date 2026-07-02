import { z } from "zod/v3";

export const getNetworkSchema = z.object({
  minStrength: z.coerce.number().min(0).max(1).default(0),
});

export type GetNetworkInput = z.infer<typeof getNetworkSchema>;
