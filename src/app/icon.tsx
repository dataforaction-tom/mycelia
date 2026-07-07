import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

/** The mushroom mark on deep soil, as the browser-tab icon. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#271d11",
          borderRadius: 12,
        }}
      >
        <svg viewBox="0 0 40 44" width="44" height="48">
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
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
          >
            <path d="M20 29 C 20 33, 18 36, 19 42" />
            <path d="M20 31 C 16 34, 13 36, 10 41" />
            <path d="M20 31 C 24 34, 27 36, 30 41" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
