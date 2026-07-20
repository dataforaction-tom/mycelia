"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
    body: "Everything grows from here. Write what happened as you'd tell a colleague — or speak it — and tending recognises who was there and where. Mention someone new and it offers to add them as a connection (you choose how eager it is in Settings).",
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

  const cardRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const titleId = "guided-tour-title";
  const bodyId = "guided-tour-body";

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

  // Remember what had focus when the tour opened, and restore it when the
  // tour closes so keyboard focus isn't dumped at the top of the page.
  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    return () => previousFocusRef.current?.focus?.();
  }, []);

  // Move focus into the card on open and on every step change, so a screen
  // reader announces the new step and Tab stays within the dialog.
  useEffect(() => {
    cardRef.current?.focus();
  }, [stepIndex]);

  // Trap Tab within the card and let Escape dismiss the tour (WCAG 2.1.2,
  // 2.4.3). The overlay is modal, so focus must not reach the page behind it.
  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      finish(false);
      return;
    }
    if (event.key !== "Tab" || !cardRef.current) return;

    const focusable = Array.from(
      cardRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    );
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === cardRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

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
  // The card is w-[min(24rem,calc(100vw-2rem))], so clamp against its real
  // width — on narrow screens 100vw - 400 goes negative and pushes it off.
  const cardWidth = hasSpotlight ? Math.min(384, window.innerWidth - 32) : 0;
  const cardLeft = hasSpotlight
    ? Math.max(16, Math.min(rect.left, window.innerWidth - cardWidth - 16))
    : 0;
  const cardStyle: React.CSSProperties = hasSpotlight
    ? rect.bottom + 240 < window.innerHeight
      ? {
          top: rect.bottom + SPOTLIGHT_PADDING + 14,
          left: cardLeft,
        }
      : {
          bottom: window.innerHeight - rect.top + SPOTLIGHT_PADDING + 14,
          left: cardLeft,
        }
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return (
    <div
      className="fixed inset-0 z-[60]"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={bodyId}
      onKeyDown={handleKeyDown}
    >
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
        ref={cardRef}
        tabIndex={-1}
        className="bg-cream fixed w-[min(24rem,calc(100vw-2rem))] rounded-2xl p-5 shadow-[0_24px_70px_rgba(27,19,10,0.5)] focus:outline-none"
        style={cardStyle}
      >
        <span className="sr-only">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
        <div className="flex items-start justify-between gap-3">
          <p id={titleId} className="font-display text-bark text-xl">
            {step.title}
          </p>
          {!isFinal && (
            <button
              type="button"
              onClick={() => finish(false)}
              className="text-muted hover:text-bark shrink-0 text-xs transition-colors"
            >
              Skip
            </button>
          )}
        </div>
        <p id={bodyId} className="text-bark-light mt-2 text-sm leading-relaxed">
          {step.body}
        </p>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex gap-1" aria-hidden="true">
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
                className="border-border-strong text-bark-light hover:bg-cream-dark rounded-full border px-4 py-2 text-xs font-medium transition-colors disabled:opacity-50"
              >
                Clear it — start fresh
              </button>
              <button
                type="button"
                onClick={() => finish(false)}
                disabled={isFinishing}
                className="from-green-dark to-moss-dark shadow-lift rounded-full bg-gradient-to-r px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-105 disabled:opacity-50"
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
                  className="text-muted hover:text-bark rounded-full px-3 py-2 text-xs font-medium transition-colors"
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={() => setStepIndex((i) => i + 1)}
                className="from-green-dark to-moss-dark shadow-lift rounded-full bg-gradient-to-r px-4 py-2 text-xs font-semibold text-white transition-all hover:brightness-105"
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
