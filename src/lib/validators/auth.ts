import { z } from "zod/v3";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(200).optional(),
  email: z.string().trim().toLowerCase().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    // bcrypt only ever looks at the first 72 bytes of input — anything
    // beyond that is silently ignored, so two passwords differing only
    // after byte 72 would hash identically. Reject rather than truncate.
    .refine(
      (value) => new TextEncoder().encode(value).length <= 72,
      "Password must be at most 72 bytes",
    ),
});

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "contributor", "viewer"]).default("viewer"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "contributor", "viewer"]),
  permissionOverrides: z
    .array(
      z.enum([
        "DELETE_CONNECTIONS",
        "DELETE_MOMENTS",
        "DELETE_SPACES",
        "MANAGE_MEMBERS",
      ])
    )
    .optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
