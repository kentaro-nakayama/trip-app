import { auth } from "@clerk/nextjs/server";
import { eq, inArray } from "drizzle-orm";
import { Compass } from "lucide-react";
import { getDb } from "@/db";
import { trips, tripMembers } from "@/db/schema";
import { resolveUsers } from "@/lib/clerk-users";
import { assignTripAccents } from "@/lib/trip-accent";
import { sortTripsByUpcoming } from "@/lib/trip-sort";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";
import { TripCard } from "@/components/trips/trip-card";
import { UserMenu } from "@/components/profile/user-menu";
import { HintBubble } from "@/components/onboarding/hint-bubble";
import { ListViewToggle } from "@/components/nav/list-view-toggle";

export default async function TripsPage() {
  const { userId } = await auth();
  if (!userId) return null;

  const db = getDb();
  const myTrips = await db
    .select({
      id: trips.id,
      name: trips.name,
      description: trips.description,
      startDate: trips.startDate,
      endDate: trips.endDate,
      role: tripMembers.role,
    })
    .from(tripMembers)
    .innerJoin(trips, eq(tripMembers.tripId, trips.id))
    .where(eq(tripMembers.userId, userId));

  const sortedTrips = sortTripsByUpcoming(myTrips);
  const tripIds = sortedTrips.map((trip) => trip.id);
  const memberRows = tripIds.length
    ? await db
        .select({ tripId: tripMembers.tripId, userId: tripMembers.userId })
        .from(tripMembers)
        .where(inArray(tripMembers.tripId, tripIds))
    : [];

  const resolvedUsers = await resolveUsers(memberRows.map((row) => row.userId));
  const membersByTrip = new Map<string, { id: string; name: string; imageUrl: string }[]>();
  for (const row of memberRows) {
    const info = resolvedUsers.get(row.userId);
    if (!info) continue;
    const list = membersByTrip.get(row.tripId) ?? [];
    list.push({ id: row.userId, name: info.name, imageUrl: info.imageUrl });
    membersByTrip.set(row.tripId, list);
  }

  const accents = assignTripAccents(tripIds);

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
            <h1 className="text-3xl font-bold text-foreground">旅行一覧</h1>
            {sortedTrips.length > 0 && (
              <p className="text-xs font-medium tracking-wide text-zinc-500">
                {sortedTrips.length}件の旅行
              </p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <HintBubble
              id="create-trip"
              align="end"
              message="ここから新しい旅行を作成できます。名前と日程を入力するだけで始められます。"
              className="inline-flex"
            >
              <CreateTripDialog />
            </HintBubble>
            <UserMenu />
          </div>
        </div>

        {sortedTrips.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400">
              <Compass className="h-7 w-7" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                まだ旅行がありません
              </p>
              <p className="text-sm text-zinc-500">
                「新しい旅行を作成」から最初の旅行を計画してみましょう
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {sortedTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={{ ...trip, members: membersByTrip.get(trip.id) ?? [] }}
                accent={accents.get(trip.id)!}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
