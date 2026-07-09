import { pgEnum } from "drizzle-orm/pg-core";

export const platformRoleEnum = pgEnum("platform_role", [
  "super_admin",
  "user",
]);

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
