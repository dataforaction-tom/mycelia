import { pgEnum } from "drizzle-orm/pg-core";

export const platformRoleEnum = pgEnum("platform_role", [
  "super_admin",
  "user",
]);

export const userStatusEnum = pgEnum("user_status", ["active", "suspended"]);

export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "contributor",
  "viewer",
]);

export const planTypeEnum = pgEnum("plan_type", [
  "trial",
  "individual",
  "organisation",
  "large",
]);

export const connectionTypeEnum = pgEnum("connection_type", [
  "person",
  "organisation",
  "group",
  "community",
]);

export const momentSourceEnum = pgEnum("moment_source", [
  "manual",
  "voice",
  "email",
  "photo",
  "quick_capture",
  "api",
]);

export const qualitySourceEnum = pgEnum("quality_source", [
  "inferred",
  "confirmed",
  "manual",
]);

export const linkSourceEnum = pgEnum("link_source", [
  "inferred",
  "confirmed",
  "manual",
]);

export const observationTypeEnum = pgEnum("observation_type", [
  "dormant",
  "dependency",
  "gap",
  "theme",
  "quality_shift",
  "bridge_risk",
  "follow_up",
]);

export const observationSeverityEnum = pgEnum("observation_severity", [
  "gentle",
  "noteworthy",
  "important",
]);

export const observationStatusEnum = pgEnum("observation_status", [
  "new",
  "seen",
  "acted_on",
  "dismissed",
  // A follow-up reminder waiting for its due date; the daily cron flips it to
  // "new" once due, at which point it surfaces like any other observation.
  "scheduled",
]);

export const webhookDeliveryStatusEnum = pgEnum("webhook_delivery_status", [
  "pending",
  "delivered",
  "failed",
  "dead",
]);

export const apiKeyScopeEnum = pgEnum("api_key_scope", ["read", "read_write"]);

export const feedbackTypeEnum = pgEnum("feedback_type", [
  "bug",
  "feature",
  "other",
]);

export const feedbackStatusEnum = pgEnum("feedback_status", [
  "new",
  "triaged",
  "planned",
  "in_progress",
  "done",
  "declined",
]);

export const feedbackPriorityEnum = pgEnum("feedback_priority", [
  "low",
  "medium",
  "high",
]);
