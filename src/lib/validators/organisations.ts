import { z } from "zod/v3";
import { isReservedSlug } from "@/lib/config/reserved-slugs";

export const createOrganisationSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  withDemoData: z.boolean().default(false),
});

export const onboardingActionSchema = z.object({
  action: z.enum(["complete-tour", "clear-demo"]),
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
    .refine((value) => !isReservedSlug(value), "This slug is reserved")
    .optional(),
});

export type CreateOrganisationInput = z.infer<typeof createOrganisationSchema>;
export type UpdateOrganisationInput = z.infer<typeof updateOrganisationSchema>;
export type OnboardingActionInput = z.infer<typeof onboardingActionSchema>;
