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
  const translationCount = songs.reduce(
    (total, song) => total + song.translations.length,
    0
  );

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

        <article className="rounded-[2rem] bg-white p-6 shadow-sm ring-1 ring-black/5 print:rounded-none print:p-0 print:shadow-none print:ring-0">
          <header className="border-b border-stone-200 pb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
              HymnBook Admin Export
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-stone-950">
              Songs Export
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-stone-600">
              All songs sorted alphabetically by title, with every available
              language translation included in the export document.
            </p>

            <dl className="mt-5 grid gap-3 text-sm text-stone-700 sm:grid-cols-3">
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Songs
                </dt>
                <dd className="mt-1 text-xl font-semibold text-stone-950">
                  {songs.length}
                </dd>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Translations
                </dt>
                <dd className="mt-1 text-xl font-semibold text-stone-950">
                  {translationCount}
                </dd>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  Generated
                </dt>
                <dd className="mt-1 font-medium text-stone-950">
                  {generatedAtLabel}
                </dd>
              </div>
            </dl>
          </header>

          <div className="mt-8 space-y-10 print:mt-6 print:space-y-0">
            {songs.map((song, index) => (
              <section
                key={song.id}
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
