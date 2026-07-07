import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt =
  "Tending — a living network of glowing threads under dark soil";

/** Under the soil: glowing threads, breathing nodes, the wordmark. */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "radial-gradient(120% 100% at 60% 0%, #3d2f1f 0%, #271d11 55%, #1b130a 100%)",
          position: "relative",
        }}
      >
        <svg
          width="1200"
          height="630"
          viewBox="0 0 1200 630"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          <g
            stroke="#e8d5a3"
            strokeOpacity="0.3"
            strokeWidth="2"
            fill="none"
            strokeDasharray="6 10"
          >
            <path d="M760 320 C 680 250, 600 210, 520 160" />
            <path d="M760 320 C 860 270, 940 230, 1010 190" />
            <path d="M760 320 C 660 380, 560 420, 470 450" />
            <path d="M760 320 C 870 380, 960 430, 1040 470" />
            <path d="M760 320 C 775 240, 785 180, 795 120" />
            <path d="M520 160 C 610 145, 700 132, 795 120" />
          </g>
          <circle cx="760" cy="320" r="34" fill="#e8d5a3" opacity="0.95" />
          <circle cx="520" cy="160" r="20" fill="#adb878" opacity="0.9" />
          <circle cx="1010" cy="190" r="24" fill="#c4a184" opacity="0.9" />
          <circle cx="470" cy="450" r="16" fill="#cd8b57" opacity="0.9" />
          <circle cx="1040" cy="470" r="20" fill="#e8d5a3" opacity="0.85" />
          <circle cx="795" cy="120" r="14" fill="#c9ad6e" opacity="0.85" />
          <g
            stroke="#e8d5a3"
            strokeOpacity="0.35"
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
          >
            <path d="M80 630 C 88 580, 72 550, 88 505 M88 505 C 78 480, 92 462, 84 435" />
            <path d="M220 630 C 212 585, 228 558, 216 518 M216 518 C 226 495, 212 478, 222 452" />
            <path d="M360 630 C 368 588, 352 562, 366 525" />
          </g>
        </svg>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
            maxWidth: 620,
          }}
        >
          <div
            style={{
              fontSize: 92,
              color: "#f0eedd",
              fontFamily: "serif",
              fontWeight: 500,
            }}
          >
            tending
          </div>
          <div style={{ fontSize: 34, color: "#bfad8e", lineHeight: 1.4 }}>
            Relationships are living things. Tend your network.
          </div>
          <div style={{ fontSize: 24, color: "#a8987e" }}>
            {siteConfig.url.replace("https://", "")}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
