import { z } from "zod/v3";

export const createMomentSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000),
  source: z
    .enum(["manual", "voice", "email", "photo", "quick_capture"])
    .default("manual"),
  eventDate: z.coerce.date().optional(),
  connectionIds: z.array(z.string().uuid()).optional(),
  spaceId: z.string().uuid().optional(),
});

export const updateMomentSchema = z.object({
  content: z.string().min(1).max(10000).optional(),
  eventDate: z.coerce.date().optional(),
});

export const listMomentsSchema = z.object({
  connectionId: z.string().uuid().optional(),
  spaceId: z.string().uuid().optional(),
  sort: z.enum(["created_at", "event_date"]).default("created_at"),
  order: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const linkConnectionsSchema = z.object({
  connectionIds: z.array(z.string().uuid()).min(1),
});

export const understandMomentSchema = z.object({
  content: z.string().min(1).max(10000),
});

export type CreateMomentInput = z.infer<typeof createMomentSchema>;
export type UpdateMomentInput = z.infer<typeof updateMomentSchema>;
export type ListMomentsInput = z.infer<typeof listMomentsSchema>;
