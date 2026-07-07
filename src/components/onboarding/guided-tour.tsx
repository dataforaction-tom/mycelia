"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface GuidedTourProps {
  organisationId: string;
}

interface TourStep {
  /** data-tour attribute of the element to spotlight; null = centred card. */
  target: string | null;
  title: string;
  body: string;
}

const STEPS: TourStep[] = [
  {
    target: null,
    title: "Welcome to tending",
    body: "We've planted a small example network so there's something alive to wander through. Let's take a short walk — it'll take about a minute.",
  },
  {
    target: "composer",
    title: "Plant a moment",
    body: "Everything grows from here. Write what happened as you'd tell a colleague — or speak it — and tending recognises who was there and where.",
  },
  {
    target: "stats",
    title: "The pulse",
    body: "Living threads, moments gathered, and what needs tending — your whole ecosystem at a glance. Each card clicks through.",
  },
  {
    target: "network",
    title: "Under the soil",
    body: "Your living network. Brighter means warmer, closer means stronger — and quiet relationships fade so you notice them before they're gone.",
  },
  {
    target: "whispers",
    title: "Whispers from the network",
    body: "tending notices patterns — a thread going quiet, a gap you might not see — and offers them gently. Never alarms, just whispers.",
  },
  {
    target: null,
    title: "One more thing",
    body: "This is all example data — Sarah, the winter programme, the quiet funder. Would you like to keep exploring with it, or clear it and start fresh?",
  },
];

const SPOTLIGHT_PADDING = 10;

export function GuidedTour({ organisationId }: GuidedTourProps) {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const step = STEPS[stepIndex];
  const isFinal = stepIndex === STEPS.length - 1;

  const measure = useCallback(() => {
    if (!step.target) {
      setRect(null);
      return;
    }
    const el = document.querySelector(`[data-tour="${step.target}"]`);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ block: "center", behavior: "instant" });
    setRect(el.getBoundingClientRect());
  }, [step.target]);

  useEffect(() => {
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  async function finish(clearDemo: boolean) {
    if (isFinishing) return;
    setIsFinishing(true);
    try {
      if (clearDemo) {
        await fetch(`/api/organisations/${organisationId}/onboarding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "clear-demo" }),
        });
      } else {
        await fetch(`/api/organisations/${organisationId}/onboarding`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "complete-tour" }),
        });
      }
    } catch {
      // Even if the flag write fails, don't trap the user in the tour.
    } finally {
      setDismissed(true);
      router.refresh();
    }
  }

  if (dismissed) return null;

  const hasSpotlight = rect !== null;

  // Card placement: under the spotlight if there's room, above otherwise.
  const cardStyle: React.CSSProperties = hasSpotlight
    ? rect.bottom + 240 < window.innerHeight
      ? {
          top: rect.bottom + SPOTLIGHT_PADDING + 14,
          left: Math.min(Math.max(rect.left, 16), window.innerWidth - 400),
        }
      : {
          bottom: window.innerHeight - rect.top + SPOTLIGHT_PADDING + 14,
          left: Math.min(Math.max(rect.left, 16), window.innerWidth - 400),
        }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-label="Guided tour">
      {/* Backdrop / spotlight cutout */}
      {hasSpotlight ? (
        <div
          className="pointer-events-none fixed rounded-2xl transition-all duration-300"
          style={{
            top: rect.top - SPOTLIGHT_PADDING,
            left: rect.left - SPOTLIGHT_PADDING,
            width: rect.width + SPOTLIGHT_PADDING * 2,
            height: rect.height + SPOTLIGHT_PADDING * 2,
            boxShadow: "0 0 0 9999px rgba(27, 19, 10, 0.72)",
          }}
        />
      ) : (
        <div className="fixed inset-0 bg-[rgba(27,19,10,0.72)]" />
      )}

      {/* Step card */}
      <div
        className="fixed w-[min(24rem,calc(100vw-2rem))] rounded-2xl bg-cream p-5 shadow-[0_24px_70px_rgba(27,19,10,0.5)]"
        style={cardStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-xl text-bark">{step.title}</p>
          {!isFinal && (
            <button
              type="button"
              onClick={() => finish(false)}
              className="shrink-0 text-xs text-muted transition-colors hover:text-bark"
            >
              Skip
            </button>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-bark-light">
          {step.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${
                  i === stepIndex ? "bg-moss" : "bg-border-strong"
                }`}
              />
            ))}
          </div>

          {isFinal ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => finish(true)}
                disabled={isFinishing}
                className="rounded-full border border-border-strong px-4 py-2 text-xs font-medium text-bark-light transition-colors hover:bg-cream-dark disabled:opacity-50"
              >
                Clear it — start fresh
              </button>
              <button
                type="button"
                onClick={() => finish(false)}
                disabled={isFinishing}
                className="rounded-full bg-gradient-to-r from-green to-moss px-4 py-2 text-xs font-semibold text-white shadow-lift transition-all hover:brightness-105 disabled:opacity-50"
              >
                Keep exploring
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setStepIndex((i) => i - 1)}
                  className="rounded-full px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-bark"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => setStepIndex((i) => i + 1)}
                className="rounded-full bg-gradient-to-r from-green to-moss px-4 py-2 text-xs font-semibold text-white shadow-lift transition-all hover:brightness-105"
              >
                {stepIndex === 0 ? "Take the walk" : "Next"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
