import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(120% 100% at 60% 0%, #3d2f1f 0%, #271d11 55%, #1b130a 100%)",
        }}
      >
        <svg viewBox="0 0 40 44" width="120" height="132">
          <path
            d="M6 17 C6 7, 34 7, 34 17 C34 20, 6 20, 6 17 Z"
            fill="#c97b47"
          />
          <path
            d="M17 20 L16 27 C16 29, 24 29, 24 27 L23 20 Z"
            fill="#e8d5a3"
          />
          <g
            stroke="#e8d5a3"
            strokeWidth="1.4"
            fill="none"
            strokeLinecap="round"
          >
            <path d="M20 29 C 20 33, 18 36, 19 42" />
            <path d="M20 31 C 16 34, 13 36, 10 41" />
            <path d="M20 31 C 24 34, 27 36, 30 41" />
            <path d="M13 37 C 11 38, 9 38, 7 39" />
            <path d="M27 37 C 29 38, 31 38, 33 39" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
