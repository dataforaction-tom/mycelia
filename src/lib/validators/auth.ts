import { z } from "zod/v3";

export const inviteMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "contributor", "viewer"]).default("viewer"),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(["admin", "contributor", "viewer"]),
});

export type InviteMemberInput = z.infer<typeof inviteMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
