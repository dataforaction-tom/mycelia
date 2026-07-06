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
    <div className="space-y-5">
      {SPECTRUM_KEYS.map((key) => {
        const config = QUALITY_SPECTRUMS[key];
        const history = qualities.filter((q) => q.spectrum === key);
        const current = history.at(-1);

        return (
          <div key={key}>
            <div className="flex items-center justify-between text-xs text-muted">
              <span className="flex items-center gap-1.5 font-medium text-bark-light">
                {config.label}
                {current?.source === "inferred" && (
                  <span className="rounded-full bg-amber/10 px-1.5 py-0.5 text-[10px] font-medium text-amber">
                    AI-suggested
                  </span>
                )}
              </span>
              {history.length >= 2 && <QualitySparkline points={history} />}
            </div>

            <div className="mt-1.5 flex items-center gap-2 text-xs text-muted">
              <span>{config.low}</span>
              <div className="relative h-1.5 flex-1 rounded-full bg-cream-dark">
                {current && (
                  <div
                    className="absolute top-1/2 h-3 w-3 -translate-y-1/2 -translate-x-1/2 rounded-full bg-moss"
                    style={{ left: `${((current.position + 1) / 2) * 100}%` }}
                  />
                )}
              </div>
              <span>{config.high}</span>
            </div>

            {!current && (
              <p className="mt-1 text-xs text-muted">Not yet set</p>
            )}

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
