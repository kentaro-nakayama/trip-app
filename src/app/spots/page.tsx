import { auth } from "@clerk/nextjs/server";
import { desc, eq, sql } from "drizzle-orm";
import { MapPinned } from "lucide-react";
import { getDb } from "@/db";
import { savedSpots, spotLists } from "@/db/schema";
import { assignTripAccents } from "@/lib/trip-accent";
import { ListViewToggle } from "@/components/nav/list-view-toggle";
import { CreateSpotListDialog } from "@/components/spots/create-spot-list-dialog";
import { SpotListCard } from "@/components/spots/spot-list-card";
import { UserMenu } from "@/components/profile/user-menu";

export default async function SpotsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const db = getDb();
  const rows = await db
    .select({
      id: spotLists.id,
      name: spotLists.name,
      description: spotLists.description,
      spotCount: sql<number>`count(${savedSpots.id})`.mapWith(Number),
    })
    .from(spotLists)
    .leftJoin(savedSpots, eq(savedSpots.spotListId, spotLists.id))
    .where(eq(spotLists.userId, userId))
    .groupBy(spotLists.id)
    .orderBy(desc(spotLists.createdAt));

  // Reuses the trip accent ramp: it hashes on id alone, so it works for any
  // list of ids, not just trips.
  const accents = assignTripAccents(rows.map((row) => row.id));

  return (
    <div className="relative flex flex-1 flex-col bg-gradient-to-b from-indigo-50/70 via-white to-white dark:from-zinc-900 dark:via-zinc-950 dark:to-zinc-950">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle,rgba(0,0,0,0.05)_1px,transparent_1px)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle,rgba(255,255,255,0.06)_1px,transparent_1px)]"
      />
      <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12 sm:py-14">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5">
            <ListViewToggle />
            <h1 className="text-3xl font-bold text-foreground">スポット一覧</h1>
            {rows.length > 0 && (
              <p className="text-xs font-medium tracking-wide text-zinc-500">
                {rows.length}件のスポットリスト
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <CreateSpotListDialog />
            <UserMenu />
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <MapPinned className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                まだスポットリストがありません
              </p>
              <p className="text-sm text-zinc-500">
                「新しいスポットリストを作成」から気になる場所を集めてみましょう
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {rows.map((spotList) => (
              <SpotListCard key={spotList.id} spotList={spotList} accent={accents.get(spotList.id)!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
