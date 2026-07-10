import { z } from "zod/v3";

export const submitFeedbackSchema = z.object({
  type: z.enum(["bug", "feature", "other"]),
  title: z.string().trim().min(3, "Give it a short title").max(200),
  body: z.string().trim().min(5, "Add a little more detail").max(5000),
  pageUrl: z.string().max(500).optional(),
  organisationId: z.string().uuid().optional(),
});

export const updateFeedbackSchema = z
  .object({
    status: z
      .enum(["new", "triaged", "planned", "in_progress", "done", "declined"])
      .optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    adminNotes: z.string().max(5000).nullable().optional(),
  })
  .refine(
    (value) =>
      value.status !== undefined ||
      value.priority !== undefined ||
      value.adminNotes !== undefined,
    { message: "Nothing to update" },
  );
