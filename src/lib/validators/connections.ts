import { z } from "zod/v3";

export const createConnectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["person", "organisation", "group", "community"]).default("person"),
  metadata: z.record(z.unknown()).optional(),
});

export const updateConnectionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["person", "organisation", "group", "community"]).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const listConnectionsSchema = z.object({
  search: z.string().optional(),
  type: z.enum(["person", "organisation", "group", "community"]).optional(),
  sort: z.enum(["name", "created_at", "updated_at"]).default("updated_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export type CreateConnectionInput = z.infer<typeof createConnectionSchema>;
export type UpdateConnectionInput = z.infer<typeof updateConnectionSchema>;
export type ListConnectionsInput = z.infer<typeof listConnectionsSchema>;
