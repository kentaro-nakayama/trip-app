import { auth } from "@clerk/nextjs/server";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { MapPinned } from "lucide-react";
import { getDb } from "@/db";
import { savedSpots, spotListMembers, spotLists } from "@/db/schema";
import { resolveUsers } from "@/lib/clerk-users";
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
      role: spotListMembers.role,
      spotCount: sql<number>`count(distinct ${savedSpots.id})`.mapWith(Number),
    })
    .from(spotListMembers)
    .innerJoin(spotLists, eq(spotListMembers.spotListId, spotLists.id))
    .leftJoin(savedSpots, eq(savedSpots.spotListId, spotLists.id))
    .where(eq(spotListMembers.userId, userId))
    .groupBy(spotLists.id, spotListMembers.role)
    .orderBy(desc(spotLists.createdAt));

  const spotListIds = rows.map((row) => row.id);
  const memberRows = spotListIds.length
    ? await db
        .select({ spotListId: spotListMembers.spotListId, userId: spotListMembers.userId })
        .from(spotListMembers)
        .where(inArray(spotListMembers.spotListId, spotListIds))
    : [];

  const resolvedUsers = await resolveUsers(memberRows.map((row) => row.userId));
  const membersBySpotList = new Map<string, { id: string; name: string; imageUrl: string }[]>();
  for (const row of memberRows) {
    const info = resolvedUsers.get(row.userId);
    if (!info) continue;
    const list = membersBySpotList.get(row.spotListId) ?? [];
    list.push({ id: row.userId, name: info.name, imageUrl: info.imageUrl });
    membersBySpotList.set(row.spotListId, list);
  }

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
            <SpotListCard
              key={spotList.id}
              spotList={{ ...spotList, members: membersBySpotList.get(spotList.id) ?? [] }}
            />
          ))}
        </div>
      )}
    </>
  );
}
