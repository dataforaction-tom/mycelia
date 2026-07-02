interface PlanCardProps {
  name: string;
  price: string;
  features: string[];
  current?: boolean;
  onSelect?: () => void;
  loading?: boolean;
}

export function PlanCard({
  name,
  price,
  features,
  current = false,
  onSelect,
  loading = false,
}: PlanCardProps) {
  return (
    <div
      className={`rounded-xl border p-6 ${
        current
          ? "border-terracotta bg-terracotta/5"
          : "border-border bg-white"
      }`}
    >
      <h3 className="text-lg font-semibold text-bark">{name}</h3>
      <p className="mt-1 text-2xl font-bold text-bark">
        {price}
        <span className="text-sm font-normal text-muted">/month</span>
      </p>

      <ul className="mt-4 space-y-2">
        {features.map((feature) => (
          <li key={feature} className="flex items-start gap-2 text-sm text-bark">
            <svg
              className="mt-0.5 h-4 w-4 shrink-0 text-moss"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
            {feature}
          </li>
        ))}
      </ul>

      {current ? (
        <div className="mt-6 rounded-lg bg-terracotta/10 py-2 text-center text-sm font-medium text-terracotta">
          Current plan
        </div>
      ) : (
        <button
          onClick={onSelect}
          disabled={loading}
          className="mt-6 w-full rounded-lg border border-terracotta bg-white py-2 text-sm font-medium text-terracotta transition-colors hover:bg-terracotta hover:text-white disabled:opacity-50"
        >
          {loading ? "Loading..." : "Select plan"}
        </button>
      )}
    </div>
  );
}
