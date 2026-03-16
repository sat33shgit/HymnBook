import { notFound } from "next/navigation";
import { getSongBySlug, getLanguages, getAllSlugs } from "@/lib/db/queries";
import { LyricsViewer } from "@/components/lyrics/LyricsViewer";
import type { Metadata } from "next";
import { truncate } from "@/lib/utils";

export const revalidate = 300;

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

  const englishTranslation = song.translations.find(
    (t) => t.languageCode === "en"
  );
  const title = englishTranslation?.title ?? "Song";
  const lyricsPreview = truncate(englishTranslation?.lyrics ?? "", 100);

  return {
    title,
    description: lyricsPreview,
    openGraph: {
      title: `${title} | HymnBook`,
      description: lyricsPreview,
      url: `/songs/${slug}`,
      type: "article",
    },
    twitter: {
      card: "summary",
      title: `${title} | HymnBook`,
      description: lyricsPreview,
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

  const [song, allLanguages] = await Promise.all([
    getSongBySlug(slug),
    getLanguages(true),
  ]);

  if (!song || !song.isPublished) {
    notFound();
  }

  const englishTranslation = song.translations.find(
    (t) => t.languageCode === "en"
  );
  const title = englishTranslation?.title ?? "Untitled";

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

  return (
    <article className="mx-auto max-w-3xl px-4 py-8 pb-24 md:pb-8">
      <header className="mb-6">
        <h1 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
          {title}
        </h1>
        {song.category && (
          <span className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-sm text-secondary-foreground">
            {song.category}
          </span>
        )}
      </header>

      <LyricsViewer
        songId={song.id}
        songSlug={song.slug}
        translations={song.translations}
        languages={songLanguages}
        defaultLang={song.defaultLang ?? "en"}
        initialLang={lang}
      />
    </article>
  );
}
