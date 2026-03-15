import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Music2, Globe, BookOpen } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  let totalSongs = 0;
  let totalLanguages = 0;

  try {
    const { getSongs, getLanguages } = await import("@/lib/db/queries");
    const [songsResult, languages] = await Promise.all([
      getSongs({ publishedOnly: false, limit: 1 }),
      getLanguages(),
    ]);
    totalSongs = songsResult.total;
    totalLanguages = languages.length;
  } catch {
    // DB not available
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-heading text-3xl font-bold">Dashboard</h1>
        <Link href="/admin/songs/new" className={buttonVariants()}>
          Add New Song
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Songs
            </CardTitle>
            <Music2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSongs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Languages
            </CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLanguages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quick Actions
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Link href="/admin/songs" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Manage Songs
            </Link>
            <Link href="/admin/languages" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Manage Languages
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
