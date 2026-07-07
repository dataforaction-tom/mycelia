export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-cream px-4">
      {/* Threads rising from below: the threshold between the two worlds */}
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 h-72 w-full text-moss/20"
        viewBox="0 0 1200 280"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <path d="M200 280 C210 190, 150 150, 170 60" />
        <path d="M420 280 C400 200, 470 170, 450 80" />
        <path d="M620 280 C640 180, 590 140, 610 40" />
        <path d="M840 280 C820 210, 880 170, 860 90" />
        <path d="M1030 280 C1050 190, 1000 160, 1020 70" />
        <circle cx="170" cy="56" r="4" fill="currentColor" stroke="none" />
        <circle cx="450" cy="76" r="4" fill="currentColor" stroke="none" />
        <circle cx="610" cy="36" r="4" fill="currentColor" stroke="none" />
        <circle cx="860" cy="86" r="4" fill="currentColor" stroke="none" />
        <circle cx="1020" cy="66" r="4" fill="currentColor" stroke="none" />
      </svg>

      <div className="stagger-children relative z-10 w-full max-w-md">
        <div className="mb-8 flex items-center justify-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-terracotta to-amber text-white shadow-lift">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 21v-7" />
              <path d="M12 14c0-4-5-3.5-6-8" />
              <path d="M12 14c0-4 5-3.5 6-8" />
              <path d="M12 14V5" />
              <circle cx="6" cy="4" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="18" cy="4" r="1.4" fill="currentColor" stroke="none" />
              <circle cx="12" cy="3" r="1.4" fill="currentColor" stroke="none" />
            </svg>
          </div>
          <span className="font-display text-2xl text-bark">tending</span>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-8 shadow-hover">
          {children}
        </div>
      </div>
    </div>
  );
}
