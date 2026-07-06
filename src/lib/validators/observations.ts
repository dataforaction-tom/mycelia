import { z } from "zod/v3";

export const listObservationsSchema = z.object({
  status: z.enum(["new", "seen", "acted_on", "dismissed"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type ListObservationsInput = z.infer<typeof listObservationsSchema>;
