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
