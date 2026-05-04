import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSongBySlug, getLanguages, getAllSlugs, isPublicSongAudioVisible } from "@/lib/db/queries";
import { LyricsViewer } from "@/components/lyrics/LyricsViewer";
import { truncate } from "@/lib/utils";
import { defaultOgImagePath, publicSiteTitle, siteUrl } from "@/lib/site";
import { deriveSongDisplayTitle, deriveSongPrimaryTitle } from "@/lib/song-utils";

export const revalidate = 300;

type Translation = { languageCode: string; title: string | null; lyrics: string | null };

/** Returns the best translation to use for SEO copy — prefers English, then default lang, then first. */
function getPreferredTranslation(
  translations: Translation[],
  defaultLang: string | null | undefined
): Translation | undefined {
  return (
    translations.find((t) => t.languageCode === "en") ??
    translations.find((t) => t.languageCode === (defaultLang ?? "en")) ??
    translations[0]
  );
}

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs();
    return slugs.slice(0, 50).map((s) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const song = await getSongBySlug(slug);
  if (!song) return { title: "Song Not Found" };

  const preferredTranslation = getPreferredTranslation(song.translations, song.defaultLang);
  const title =
    deriveSongPrimaryTitle(song.translations, song.defaultLang) ||
    preferredTranslation?.title ||
    "Song";
  const lyricsPreview = truncate(preferredTranslation?.lyrics ?? "", 160);
  const description = lyricsPreview
    ? `${lyricsPreview} — ${title} lyrics on ${publicSiteTitle}`
    : `Read the lyrics of "${title}" on ${publicSiteTitle}`;

  const languageNames = song.translations.map((t) => t.languageCode);
  const songUrl = `/songs/${slug}`;

  return {
    title,
    description,
    keywords: [
      title,
      `${title} lyrics`,
      `${title} christian song`,
      ...languageNames.map((l) => `${title} ${l} lyrics`),
      "christian song lyrics",
      publicSiteTitle,
    ],
    alternates: { canonical: songUrl },
    openGraph: {
      title: `${title} | ${publicSiteTitle}`,
      description,
      url: songUrl,
      type: "article",
      images: [
        {
          url: defaultOgImagePath,
          width: 1200,
          height: 630,
          alt: `${title} — ${publicSiteTitle}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${publicSiteTitle}`,
      description,
      images: [defaultOgImagePath],
    },
  };
}

export default async function SongDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}) {
  const { slug } = await params;
  const { lang } = await searchParams;

  const [song, allLanguages, isAudioVisible] = await Promise.all([
    getSongBySlug(slug),
    getLanguages(true),
    isPublicSongAudioVisible(),
  ]);

  if (!song || !song.isPublished) {
    notFound();
  }

  const title =
    deriveSongDisplayTitle(song.translations, {
      preferredLanguageCode: lang,
      defaultLanguageCode: song.defaultLang,
    }) || "Untitled";

  // Only show languages that have translations for this song
  const availableLanguageCodes = new Set(
    song.translations.map((t) => t.languageCode)
  );
  const songLanguages = allLanguages
    .filter((l) => availableLanguageCodes.has(l.code))
    .sort((a, b) => {
      if (a.code === "en") return -1;
      if (b.code === "en") return 1;
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    })
    .map((l) => ({ code: l.code, nativeName: l.nativeName }));
  const mobileSummary = `${new Intl.NumberFormat("en-US").format(song.viewCount ?? 0)} views / Available in ${songLanguages.length} ${songLanguages.length === 1 ? "language" : "languages"}`;

  const preferredTranslation = getPreferredTranslation(song.translations, song.defaultLang);
  const lyricsSnippet = truncate(preferredTranslation?.lyrics ?? "", 200);

  const songJsonLd = {
    "@context": "https://schema.org",
    "@type": "MusicComposition",
    name: title,
    url: `${siteUrl}/songs/${song.slug}`,
    description: lyricsSnippet || undefined,
    ...(song.category ? { genre: song.category } : {}),
    inLanguage: songLanguages.map((l) => l.code),
    publisher: {
      "@type": "Organization",
      name: publicSiteTitle,
      url: siteUrl,
    },
  };

  return (
    <article className="px-4 py-5 pb-14 md:px-0 md:py-0 md:pb-0 overflow-x-hidden max-w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(songJsonLd) }}
      />
      <header className="mb-5 md:hidden">
        <div
          className="rounded-[1.8rem] px-4 py-6 text-[var(--desktop-hero-foreground)] shadow-[0_28px_60px_rgba(6,78,59,0.22)] overflow-x-hidden overflow-y-visible min-h-[7rem] md:min-h-0 max-w-full"
          style={{
            backgroundImage:
              "linear-gradient(135deg, var(--desktop-hero-start), var(--desktop-hero-end))",
          }}
        >
          <div className="flex flex-wrap gap-1.5">
            {song.category && (
              <span className="rounded-full bg-white/12 px-2.5 py-0.5 text-[0.7rem] font-semibold">
                {song.category}
              </span>
            )}
            {songLanguages.slice(0, 3).map((language) => (
              <span
                key={language.code}
                className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-[var(--desktop-hero-muted)]"
              >
                {language.nativeName}
              </span>
            ))}
            {songLanguages.length > 3 && (
              <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.7rem] font-semibold text-[var(--desktop-hero-muted)]">
                +{songLanguages.length - 3}
              </span>
            )}
          </div>
          <h1
            id={`song-title-${song.id}`}
            className="mt-3 font-heading text-[clamp(1.85rem,8vw,2.9rem)] font-semibold leading-[0.97] tracking-[-0.05em] break-words overflow-visible max-w-full"
          >
            {title}
          </h1>
          <p className="mt-3 text-[0.82rem] leading-6 text-[var(--desktop-hero-muted)]">
            {mobileSummary}
          </p>
        </div>
      </header>

      <LyricsViewer
        songId={song.id}
        songSlug={song.slug}
        translations={song.translations}
        languages={songLanguages}
        defaultLang={song.defaultLang ?? "en"}
        initialLang={lang}
        showAudio={isAudioVisible}
        songCategory={song.category}
        songViewCount={song.viewCount}
      />
    </article>
  );
}
