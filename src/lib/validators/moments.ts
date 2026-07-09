import { z } from "zod/v3";

export const createMomentSchema = z.object({
  content: z.string().min(1, "Content is required").max(10000),
  source: z
    .enum(["manual", "voice", "email", "photo", "quick_capture"])
    .default("manual"),
  eventDate: z.coerce.date().optional(),
  connectionIds: z.array(z.string().uuid()).optional(),
  spaceId: z.string().uuid().optional(),
  // A follow-up reminder the composer detected and the user confirmed. Stored
  // as a "scheduled" observation that surfaces on its dueDate.
  followUp: z
    .object({
      note: z.string().min(1).max(500),
      dueDate: z.coerce.date(),
    })
    .optional(),
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
  // The user's IANA timezone (e.g. "Europe/London"), so the model can resolve
  // relative dates like "today" / "next week" against their actual calendar
  // day rather than the server's UTC day. Optional — falls back to UTC.
  timeZone: z.string().max(100).optional(),
});

export type CreateMomentInput = z.infer<typeof createMomentSchema>;
export type UpdateMomentInput = z.infer<typeof updateMomentSchema>;
export type ListMomentsInput = z.infer<typeof listMomentsSchema>;
