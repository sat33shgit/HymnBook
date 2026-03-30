import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "320px",
            height: "320px",
            borderRadius: "88px",
            background: "#ffffff",
            alignItems: "center",
            justifyContent: "center",
            boxShadow:
              "0 32px 70px rgba(15, 23, 42, 0.10), 0 0 0 1px rgba(148, 163, 184, 0.16)",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "220px",
              height: "220px",
              borderRadius: "52px",
              background: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              width="180"
              height="180"
              fill="none"
            >
              <rect width="64" height="64" rx="14" fill="#ffffff" />
              <path
                d="M26 46V20l24-4v26"
                stroke="#232A75"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="20" cy="46" r="8" stroke="#232A75" strokeWidth="4" />
              <circle cx="44" cy="42" r="8" stroke="#232A75" strokeWidth="4" />
            </svg>
          </div>
        </div>
      </div>
    ),
    size
  );
}
