import { z } from "zod/v3";
import type { ContactDetails } from "@/lib/db/schema/connections";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional();

/**
 * Standard, optional contact details. Empty strings are accepted (forms send
 * them) and stripped by `normaliseContactDetails` before storage; email is
 * only format-checked when actually provided.
 */
export const contactDetailsSchema = z.object({
  email: z
    .union([z.literal(""), z.string().trim().email("Enter a valid email address").max(320)])
    .optional(),
  phone: optionalText(50),
  website: optionalText(300),
  location: optionalText(200),
});

/** Drop blank/whitespace-only fields; return undefined if nothing is left. */
export function normaliseContactDetails(
  input: z.infer<typeof contactDetailsSchema> | undefined
): ContactDetails | undefined {
  if (!input) return undefined;
  const cleaned: ContactDetails = {};
  for (const [key, value] of Object.entries(input)) {
    const trimmed = typeof value === "string" ? value.trim() : value;
    if (trimmed) cleaned[key as keyof ContactDetails] = trimmed as string;
  }
  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

export const createConnectionSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  type: z.enum(["person", "organisation", "group", "community"]).default("person"),
  contactDetails: contactDetailsSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const updateConnectionSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  type: z.enum(["person", "organisation", "group", "community"]).optional(),
  contactDetails: contactDetailsSchema.optional(),
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
