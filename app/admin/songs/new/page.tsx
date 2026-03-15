import { getLanguages } from "@/lib/db/queries";
import { SongForm } from "@/components/admin/SongForm";

export const dynamic = "force-dynamic";

export default async function NewSongPage() {
  const languages = await getLanguages(true);

  return (
    <div>
      <h1 className="mb-6 font-heading text-3xl font-bold">Add New Song</h1>
      <SongForm
        languages={languages.map((l) => ({
          code: l.code,
          name: l.name,
          nativeName: l.nativeName,
        }))}
        mode="create"
      />
    </div>
  );
}
