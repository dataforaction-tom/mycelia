import { describe, it, expect } from "vitest";
import {
  subscriptionState,
  trialDaysLeft,
  dueTrialReminder,
} from "./subscription";

const DAY_MS = 24 * 60 * 60 * 1000;
const inDays = (n: number) => new Date(Date.now() + n * DAY_MS);

describe("subscriptionState", () => {
  it("is active on any paid plan regardless of trial date", () => {
    expect(
      subscriptionState({ plan: "individual", trialEndsAt: inDays(-100) }),
    ).toBe("active");
    expect(subscriptionState({ plan: "individual", trialEndsAt: null })).toBe(
      "active",
    );
  });

  it("is trialing while the trial end is in the future", () => {
    expect(subscriptionState({ plan: "trial", trialEndsAt: inDays(10) })).toBe(
      "trialing",
    );
  });

  it("is expired once the trial end passes", () => {
    expect(subscriptionState({ plan: "trial", trialEndsAt: inDays(-1) })).toBe(
      "expired",
    );
  });

  it("treats a trial plan with no end date as expired, not immortal", () => {
    expect(subscriptionState({ plan: "trial", trialEndsAt: null })).toBe(
      "expired",
    );
  });
});

describe("dueTrialReminder", () => {
  const trialWith = (days: number) => ({
    plan: "trial",
    trialEndsAt: inDays(days),
  });

  it("sends nothing early in the trial", () => {
    expect(dueTrialReminder(trialWith(20), {})).toBeNull();
  });

  it("sends the 7-day warning once", () => {
    expect(dueTrialReminder(trialWith(6.5), {})).toBe("d7");
    expect(dueTrialReminder(trialWith(6.5), { d7: true })).toBeNull();
  });

  it("sends the 1-day warning once, even if d7 was missed", () => {
    expect(dueTrialReminder(trialWith(0.5), {})).toBe("d1");
    expect(dueTrialReminder(trialWith(0.5), { d7: true })).toBe("d1");
    expect(dueTrialReminder(trialWith(0.5), { d7: true, d1: true })).toBeNull();
  });

  it("sends nothing to paid or expired orgs", () => {
    expect(
      dueTrialReminder({ plan: "individual", trialEndsAt: inDays(3) }, {}),
    ).toBeNull();
    expect(dueTrialReminder(trialWith(-1), {})).toBeNull();
  });
});

describe("trialDaysLeft", () => {
  it("rounds up partial days", () => {
    expect(trialDaysLeft(new Date(Date.now() + 1.5 * DAY_MS))).toBe(2);
  });

  it("clamps to zero after expiry and with no date", () => {
    expect(trialDaysLeft(inDays(-3))).toBe(0);
    expect(trialDaysLeft(null)).toBe(0);
  });
});
