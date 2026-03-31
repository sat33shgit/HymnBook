import { notFound } from "next/navigation";
import { getSongById, getLanguages } from "@/lib/db/queries";
import { SongForm } from "@/components/admin/SongForm";

export const dynamic = "force-dynamic";

export default async function EditSongPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const songId = parseInt(id, 10);
  if (isNaN(songId)) notFound();

  const [song, languages] = await Promise.all([
    getSongById(songId),
    getLanguages(true),
  ]);

  if (!song) notFound();

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-bold">Edit Song</h1>
      <SongForm
        languages={languages.map((l) => ({
          code: l.code,
          name: l.name,
          nativeName: l.nativeName,
        }))}
        mode="edit"
        initialData={{
          id: song.id,
          slug: song.slug,
          category: song.category ?? "",
          isPublished: song.isPublished ?? true,
          translations: song.translations.map((t) => ({
            languageCode: t.languageCode,
            title: t.title,
            lyrics: t.lyrics,
            englishMeaning: t.englishMeaning ?? "",
            audioUrl: t.audioUrl ?? null,
            youtubeUrl: t.youtubeUrl ?? null,
          })),
        }}
      />
    </div>
  );
}
