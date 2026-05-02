// Generates static email header PNG images and saves to public/
// Run: node scripts/generate-email-header.mjs
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath, pathToFileURL } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Use Next.js bundled ImageResponse (satori + resvg, no extra deps needed)
const ogPath = join(root, "node_modules/next/dist/compiled/@vercel/og/index.node.js");
const { ImageResponse } = await import(pathToFileURL(ogPath).href);

const fontBuffer = readFileSync(join(root, "public/fonts/cinzel-decorative-bold.ttf"));
const logoBuffer = readFileSync(join(root, "public/logo.jpg"));
const logoBase64 = `data:image/jpeg;base64,${logoBuffer.toString("base64")}`;

async function generateHeader(isDark, outFile) {
  const response = new ImageResponse(
    {
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: isDark ? "#1f6f52" : "#ffffff",
          width: "100%",
          height: "100%",
          padding: "20px",
        },
        children: [
          {
            type: "img",
            props: {
              src: logoBase64,
              width: 72,
              height: 72,
              style: { borderRadius: "10px", marginBottom: "14px" },
            },
          },
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "row",
                gap: "8px",
                fontFamily: "Cinzel Decorative",
                fontWeight: 700,
                fontSize: "36px",
                color: isDark ? "#ffffff" : "#0f172a",
                letterSpacing: "-0.01em",
              },
              children: ["Sing", "Unto", "The", "Lord"].map((word) => ({
                type: "span",
                props: {
                  style: word === "Lord" ? { marginLeft: "-12px" } : {},
                  children: word,
                },
              })),
            },
          },
        ],
      },
    },
    {
      width: 600,
      height: 160,
      fonts: [
        {
          name: "Cinzel Decorative",
          data: fontBuffer,
          weight: 700,
          style: "normal",
        },
      ],
    }
  );

  const arrayBuffer = await response.arrayBuffer();
  writeFileSync(outFile, Buffer.from(arrayBuffer));
  console.log("Written:", outFile);
}

mkdirSync(join(root, "public"), { recursive: true });
await generateHeader(false, join(root, "public/email-header.png"));
await generateHeader(true, join(root, "public/email-header-dark.png"));

