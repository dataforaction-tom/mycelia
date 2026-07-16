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
    <div className="bg-cream mx-auto w-full max-w-[640px] overflow-hidden rounded-3xl shadow-[0_40px_100px_rgba(27,19,10,0.35)]">
      {/* Soil band with hyphae growing up */}
      <div className="underground relative h-[86px] overflow-hidden rounded-none border-none">
        <Filaments width={640} height={86} count={5} seed={3} />
        <Spores count={3} seed={3} />
        <p className="font-display text-soil-ink absolute bottom-4 left-6 text-2xl">
          Plant a moment
        </p>
      </div>

      <div className="px-6 py-5">
        <div className="border-border-strong text-bark min-h-[96px] rounded-2xl border bg-white px-4 py-3 text-[15px] leading-[1.65]">
          Bumped into{" "}
          <span className="bg-moss/20 text-moss-dark rounded px-1 font-semibold">
            Amara Okafor
          </span>{" "}
          at the{" "}
          <span className="bg-amber/20 text-amber-dark rounded px-1 font-semibold">
            Community Allotment
          </span>{" "}
          — she offered to introduce me to the council food team
          <span
            className="animate-glow bg-moss ml-0.5 inline-block h-[18px] w-[2px] translate-y-[3px]"
            aria-hidden="true"
          />
        </div>

        <div className="text-muted mt-3 flex items-center gap-2 text-xs">
          <span className="animate-glow bg-moss h-[7px] w-[7px] shrink-0 rounded-full" />
          tending recognised 1 person and 1 space — new threads will grow from
          this moment
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="border-green/40 bg-green/15 text-green-dark rounded-full border px-3.5 py-1.5 text-xs font-semibold">
            Growing trust
          </span>
          <span className="border-border-strong text-bark-light rounded-full border px-3.5 py-1.5 text-xs">
            First meeting
          </span>
          <span className="border-border-strong text-bark-light rounded-full border px-3.5 py-1.5 text-xs">
            Working together
          </span>
          <span className="border-border-strong text-bark-light rounded-full border px-3.5 py-1.5 text-xs">
            A wobble
          </span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="text-muted text-xs">
            Write it as you&apos;d tell a colleague — tending does the filing.
          </p>
          <Link
            href="/sign-in"
            className="from-green-dark to-moss-dark shrink-0 rounded-full bg-gradient-to-r px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_rgba(111,154,79,0.35)] transition-all hover:brightness-105"
          >
            Plant it
          </Link>
        </div>
      </div>
    </div>
  );
}
