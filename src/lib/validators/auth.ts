import { z } from "zod/v3";

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

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
