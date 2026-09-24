import { auth } from "@clerk/nextjs/server";
import { desc, eq, sql } from "drizzle-orm";
import { MapPinned } from "lucide-react";
import { getDb } from "@/db";
import { savedSpots, spotLists } from "@/db/schema";
import { assignTripAccents } from "@/lib/trip-accent";
import { CreateSpotListDialog } from "@/components/spots/create-spot-list-dialog";
import { SpotListCard } from "@/components/spots/spot-list-card";

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
    <>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-zinc-200 pb-6 dark:border-zinc-800">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold text-foreground">スポット一覧</h1>
          {rows.length > 0 && (
            <p className="text-xs font-medium tracking-wide text-zinc-500">
              {rows.length}件のスポットリスト
            </p>
          )}
        </div>
        <CreateSpotListDialog />
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
    </>
  );
}
