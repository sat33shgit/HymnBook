import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getSongsForExport } from "@/lib/db/queries";
import { ExportActions } from "./ExportActions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Songs Export",
  robots: {
    index: false,
    follow: false,
  },
};

function formatLanguageLabel(translation: ExportSong["translations"][number]) {
  const names = [translation.languageNativeName, translation.languageName].filter(
    (value): value is string => Boolean(value)
  );
  const uniqueNames = names.filter(
    (value, index) => names.indexOf(value) === index
  );
  const nameLabel = uniqueNames.join(" / ");

  return nameLabel
    ? `${translation.languageCode.toUpperCase()} - ${nameLabel}`
    : translation.languageCode.toUpperCase();
}

type ExportSong = Awaited<ReturnType<typeof getSongsForExport>>[number];

export default async function AdminSongsExportPage({
  searchParams,
}: {
  searchParams: Promise<{ autoprint?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  const [{ autoprint }, songs] = await Promise.all([
    searchParams,
    getSongsForExport(),
  ]);

  const generatedAtLabel = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());

  // Calculate unique language codes across all songs
  const languageSet = new Set<string>();
  songs.forEach(song => {
    song.translations.forEach(t => {
      if (t.languageCode) languageSet.add(t.languageCode);
    });
  });
  const languageCount = languageSet.size;

  // Count the total number of songs for all languages (all translations)
  const totalSongsCount = songs.reduce((acc, song) => acc + song.translations.length, 0);

  // Build a map of language code to { name, count }
  const languageSongCounts: Record<string, { name: string; count: number }> = {};
  songs.forEach(song => {
    song.translations.forEach(t => {
      if (!t.languageCode) return;
      if (!languageSongCounts[t.languageCode]) {
        languageSongCounts[t.languageCode] = {
          name: t.languageNativeName || t.languageName || t.languageCode.toUpperCase(),
          count: 0,
        };
      }
      languageSongCounts[t.languageCode].count += 1;
    });
  });

  return (
    <div className="min-h-screen bg-stone-100 text-stone-900 print:bg-white">
      <style>{`
        @page {
          size: A4;
          margin: 14mm;
        }

        @media print {
          html, body {
            background: #ffffff;
          }

          .song-export-entry {
            break-before: page;
            page-break-before: always;
          }

          .song-export-entry:first-of-type {
            break-before: auto;
            page-break-before: auto;
          }
        }

        .export-lyrics {
          white-space: pre-wrap;
          line-height: 1.85;
          unicode-bidi: plaintext;
        }
      `}</style>


      <div className="mx-auto max-w-5xl px-4 py-6 print:max-w-none print:px-0 print:py-0">
        <ExportActions autoprint={autoprint === "1"} />

        {/* First Page / Cover Page */}
        <section className="flex flex-col items-center justify-center min-h-[60vh] py-16 print:py-24 mb-12 bg-gradient-to-br from-stone-100 to-white rounded-3xl shadow-md ring-1 ring-black/10 print:rounded-none print:shadow-none print:ring-0" style={{ breakAfter: 'page', pageBreakAfter: 'always' }}>
          <h1 className="text-5xl font-extrabold tracking-tight text-stone-900 mb-4 text-center drop-shadow-lg">Sing unto the Lord</h1>
          <p className="text-lg text-stone-600 mb-10 text-center max-w-2xl">A collection of hymns and spiritual songs in multiple languages, compiled for worship and devotion.</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl mb-8">
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Songs</div>
              <div className="mt-2 text-3xl font-bold text-stone-950">{totalSongsCount}</div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Languages</div>
              <div className="mt-2 text-3xl font-bold text-stone-950">{languageCount}</div>
            </div>
            <div className="rounded-2xl border border-stone-200 bg-stone-50 px-6 py-5 text-center">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Generated</div>
              <div className="mt-2 text-lg font-medium text-stone-950">{generatedAtLabel}</div>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {Object.entries(languageSongCounts)
              .sort((a, b) => b[1].count - a[1].count)
              .map(([code, { name, count }]) => (
                <div key={code} className="rounded-xl border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-stone-700 flex items-center gap-2">
                  <span className="font-semibold text-stone-950">{name}</span>
                  <span className="ml-2">({count} song{count !== 1 ? 's' : ''})</span>
                </div>
              ))}
          </div>
        </section>

        {/* Table of Contents with individual language songs */}
        <section className="mb-8 print:mb-8">
          <h2 className="text-2xl font-bold mb-4 text-center">Table of Contents</h2>
          <ol className="ml-6 space-y-1">
            {songs.flatMap((song, songIdx) =>
              song.translations.map((translation, transIdx, arr) => {
                // Calculate the flat index for song number
                const flatIndex = songs.slice(0, songIdx).reduce((acc, s) => acc + s.translations.length, 0) + transIdx + 1;
                return (
                  <li key={`${song.id}-${translation.languageCode}`} className="flex justify-between items-center gap-2">
                    <span>
                      <span className="font-semibold text-stone-500 mr-2">{flatIndex}.</span>
                      <a
                        href={`#song-${song.id}-${translation.languageCode}`}
                        className="text-blue-700 underline underline-offset-2 hover:text-blue-900"
                      >
                        {song.title} <span className="text-stone-500">({translation.languageNativeName || translation.languageName || translation.languageCode.toUpperCase()})</span>
                      </a>
                    </span>
                    {/* Page number removed as requested */}
                  </li>
                );
              })
            )}
          </ol>
        </section>

        <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          <header className="border-b border-stone-200 pb-6">
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-950">
              Songs Export
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              All songs sorted alphabetically by title, with every available language translation included in the export document.
            </p>
          </header>

          <div className="mt-8 space-y-10 print:mt-6 print:space-y-0">
            {songs.map((song, index) => (
              <section
                key={song.id}
                id={`song-${song.id}`}
                className="song-export-entry pt-0 print:pt-0"
              >
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-200 pb-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Song {index + 1}
                    </p>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-950">
                      {song.title}
                    </h2>
                    <p className="mt-1 text-sm text-stone-500">/{song.slug}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 text-xs font-medium">
                    <span className="rounded-full border border-stone-300 px-3 py-1 text-stone-700">
                      {song.isPublished ? "Published" : "Draft"}
                    </span>
                    <span className="rounded-full border border-stone-300 px-3 py-1 text-stone-700">
                      {song.translations.length}{" "}
                      {song.translations.length === 1
                        ? "language"
                        : "languages"}
                    </span>
                    {song.category && (
                      <span className="rounded-full border border-stone-300 px-3 py-1 text-stone-700">
                        {song.category}
                      </span>
                    )}
                  </div>
                </div>

                {song.translations.length > 0 ? (
                  <div className="mt-6 space-y-6">
                    {song.translations.map((translation) => (
                      <section
                        key={`${song.id}-${translation.languageCode}`}
                        id={`song-${song.id}-${translation.languageCode}`}
                        lang={translation.languageCode}
                        className="rounded-3xl border border-stone-200 bg-stone-50/60 px-5 py-5"
                        style={
                          translation.fontStack
                            ? { fontFamily: translation.fontStack }
                            : undefined
                        }
                      >
                        <div className="border-b border-stone-200 pb-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            {formatLanguageLabel(translation)}
                          </p>
                          <h3 className="mt-2 text-xl font-semibold text-stone-950">
                            {translation.title}
                          </h3>
                        </div>

                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                            Lyrics
                          </p>
                          <div className="export-lyrics mt-3 text-[15px] text-stone-900">
                            {translation.lyrics}
                          </div>
                        </div>

                        {translation.englishMeaning && (
                          <div className="mt-5 border-t border-dashed border-stone-300 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              English Meaning
                            </p>
                            <div className="export-lyrics mt-3 text-[14px] text-stone-700">
                              {translation.englishMeaning}
                            </div>
                          </div>
                        )}

                        {translation.youtubeUrl && (
                          <div className="mt-5 border-t border-dashed border-stone-300 pt-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                              YouTube URL
                            </p>
                            <a
                              href={translation.youtubeUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-3 block break-all text-[14px] text-blue-700 underline underline-offset-2"
                            >
                              {translation.youtubeUrl}
                            </a>
                          </div>
                        )}
                      </section>
                    ))}
                  </div>
                ) : (
                  <p className="mt-6 rounded-2xl border border-dashed border-stone-300 px-4 py-5 text-sm text-stone-500">
                    No translations are available for this song.
                  </p>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    </div>
  );
}
