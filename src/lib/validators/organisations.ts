import { z } from "zod/v3";

export const createOrganisationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export const updateOrganisationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z
    .string()
    .min(2)
    .max(60)
    .regex(
      /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
      "Slug must be lowercase alphanumeric with dashes"
    )
    .optional(),
});

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>;
export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
