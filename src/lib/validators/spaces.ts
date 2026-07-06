import { z } from "zod/v3";

export const createSpaceSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
});

export const updateSpaceSchema = createSpaceSchema.partial();

export const listSpacesSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const linkSpacesSchema = z.object({
  spaceIds: z.array(z.string().uuid()).min(1),
});

export type CreateSpaceInput = z.infer<typeof createSpaceSchema>;
export type UpdateSpaceInput = z.infer<typeof updateSpaceSchema>;
export type ListSpacesInput = z.infer<typeof listSpacesSchema>;
