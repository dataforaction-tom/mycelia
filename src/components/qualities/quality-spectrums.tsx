import { QUALITY_SPECTRUMS, SPECTRUM_KEYS } from "@/lib/config/qualities";
import { QualitySparkline } from "./quality-sparkline";
import { QualitySetControl } from "./quality-set-control";

interface QualityRow {
  spectrum: string;
  position: number;
  createdAt: Date;
  source: string;
}

interface QualitySpectrumsProps {
  qualities: QualityRow[];
  connectionId: string;
  organisationId: string;
}

export function QualitySpectrums({
  qualities,
  connectionId,
  organisationId,
}: QualitySpectrumsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {SPECTRUM_KEYS.map((key) => {
        const config = QUALITY_SPECTRUMS[key];
        const history = qualities.filter((q) => q.spectrum === key);
        const current = history.at(-1);

        return (
          <div
            key={key}
            className="border-border bg-surface shadow-lift rounded-xl border p-4"
          >
            <div className="text-muted flex items-center justify-between text-xs">
              <span className="text-bark-light flex items-center gap-1.5 font-medium">
                {config.label}
                {current?.source === "inferred" && (
                  <span className="bg-amber/10 text-amber-dark rounded-full px-1.5 py-0.5 text-[10px] font-medium">
                    AI-suggested
                  </span>
                )}
              </span>
              {history.length >= 2 && <QualitySparkline points={history} />}
            </div>

            <div className="text-muted mt-1.5 flex items-center gap-2 text-xs">
              <span>{config.low}</span>
              <div className="bg-cream-dark relative h-1.5 flex-1 rounded-full">
                {current && (
                  <>
                    <div
                      className="from-moss-light to-green absolute inset-y-0 left-0 rounded-full bg-gradient-to-r"
                      style={{
                        width: `${((current.position + 1) / 2) * 100}%`,
                      }}
                    />
                    <div
                      className="animate-breathe-soft border-cream bg-green absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow-[0_0_10px_rgba(111,154,79,0.6)]"
                      style={{ left: `${((current.position + 1) / 2) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <span>{config.high}</span>
            </div>

            {!current && <p className="text-muted mt-1 text-xs">Not yet set</p>}

            <QualitySetControl
              connectionId={connectionId}
              organisationId={organisationId}
              spectrum={key}
              initialPosition={current?.position ?? 0}
            />
          </div>
        );
      })}
    </div>
  );
}
