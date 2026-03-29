"use client";

import type { FontSize } from "@/types";
import { FONT_SIZE_MAP } from "@/types";

interface LyricsTextProps {
  lyrics: string;
  fontSize: FontSize;
  languageCode: string;
}

export function LyricsText({ lyrics, fontSize, languageCode }: LyricsTextProps) {
  const isIndic = ["te", "hi", "ta", "ml"].includes(languageCode);
  const fontFamily = isIndic ? "'Noto Sans', var(--font-sans)" : "var(--font-sans)";

  return (
    <div
      className="lyrics-text"
      style={{
        fontSize: `${FONT_SIZE_MAP[fontSize]}px`,
        fontFamily,
      }}
      lang={languageCode}
    >
      {lyrics}
    </div>
  );
}
