import Link from "next/link";
import { Filaments } from "@/components/network/filaments";
import { Spores } from "@/components/network/spores";

/**
 * The "Plant a moment" modal, recreated as static-but-alive markup so
 * visitors see the signature interaction — inline recognition chips, the
 * status whisper, the soil band — without any client state.
 */
export function LandingComposerDemo() {
  return (
    <div className="mx-auto w-full max-w-[640px] overflow-hidden rounded-3xl bg-cream shadow-[0_40px_100px_rgba(27,19,10,0.35)]">
      {/* Soil band with hyphae growing up */}
      <div className="underground relative h-[86px] overflow-hidden rounded-none border-none">
        <Filaments width={640} height={86} count={5} seed={3} />
        <Spores count={3} seed={3} />
        <p className="absolute bottom-4 left-6 font-display text-2xl text-soil-ink">
          Plant a moment
        </p>
      </div>

      <div className="px-6 py-5">
        <div className="min-h-[96px] rounded-2xl border border-border-strong bg-white px-4 py-3 text-[15px] leading-[1.65] text-bark">
          Bumped into{" "}
          <span className="rounded bg-moss/20 px-1 font-semibold text-moss-dark">
            Amara Okafor
          </span>{" "}
          at the{" "}
          <span className="rounded bg-amber/20 px-1 font-semibold text-amber-dark">
            Community Allotment
          </span>{" "}
          — she offered to introduce me to the council food team
          <span
            className="animate-glow ml-0.5 inline-block h-[18px] w-[2px] translate-y-[3px] bg-moss"
            aria-hidden="true"
          />
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
          <span className="animate-glow h-[7px] w-[7px] shrink-0 rounded-full bg-moss" />
          tending recognised 1 person and 1 space — new threads will grow
          from this moment
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-green/40 bg-green/15 px-3.5 py-1.5 text-xs font-semibold text-green-dark">
            Growing trust
          </span>
          <span className="rounded-full border border-border-strong px-3.5 py-1.5 text-xs text-bark-light">
            First meeting
          </span>
          <span className="rounded-full border border-border-strong px-3.5 py-1.5 text-xs text-bark-light">
            Working together
          </span>
          <span className="rounded-full border border-border-strong px-3.5 py-1.5 text-xs text-bark-light">
            A wobble
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-xs text-muted">
            Write it as you&apos;d tell a colleague — tending does the filing.
          </p>
          <Link
            href="/sign-in"
            className="shrink-0 rounded-full bg-gradient-to-r from-green to-moss px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(111,154,79,0.35)] transition-all hover:brightness-105"
          >
            Plant it
          </Link>
        </div>
      </div>
    </div>
  );
}
