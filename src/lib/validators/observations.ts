import { z } from "zod/v3";

export const listObservationsSchema = z.object({
  status: z.enum(["new", "seen", "acted_on", "dismissed"]).optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const updateObservationSchema = z
  .object({
    status: z.enum(["seen", "acted_on", "dismissed"]).optional(),
    userResponse: z.string().max(2000).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

export type ListObservationsInput = z.infer<typeof listObservationsSchema>;
export type UpdateObservationInput = z.infer<typeof updateObservationSchema>;
