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
          padding: "56px",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #eef3f8 0%, #ffffff 42%, #e6eef9 100%)",
          color: "#0f172a",
          fontFamily:
            '"Segoe UI", "Segoe UI Variable", Tahoma, Geneva, Verdana, sans-serif',
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
          }}
        >
          <div
            style={{
              display: "flex",
              width: "96px",
              height: "96px",
              borderRadius: "26px",
              background: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 20px 38px rgba(15, 23, 42, 0.10)",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 64 64"
              width="56"
              height="56"
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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "28px",
                fontWeight: 700,
                letterSpacing: "-0.03em",
              }}
            >
              HymnBook
            </div>
            <div
              style={{
                display: "flex",
                marginTop: "6px",
                fontSize: "20px",
                color: "#475569",
              }}
            >
              Christian Song Lyrics
            </div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "18px",
            maxWidth: "920px",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: "70px",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.06em",
            }}
          >
            Browse Christian songs in multiple languages
          </div>
          <div
            style={{
              display: "flex",
              fontSize: "28px",
              color: "#53657d",
            }}
          >
            Search by title or lyrics and read songs across English, Telugu,
            Hindi, Tamil, Malayalam, and more.
          </div>
        </div>
      </div>
    ),
    size
  );
}
