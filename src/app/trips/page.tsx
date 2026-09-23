import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { trips, tripMembers } from "@/db/schema";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreateTripDialog } from "@/components/trips/create-trip-dialog";

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
    })
    .from(tripMembers)
    .innerJoin(trips, eq(tripMembers.tripId, trips.id))
    .where(eq(tripMembers.userId, userId));

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">旅行一覧</h1>
        <div className="flex items-center gap-4">
          <CreateTripDialog />
          <UserButton />
        </div>
      </div>

      {myTrips.length === 0 ? (
        <p className="text-zinc-500">
          まだ旅行がありません。「新しい旅行を作成」から始めましょう。
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {myTrips.map((trip) => (
            <Link key={trip.id} href={`/trips/${trip.id}`}>
              <Card className="h-full transition-colors hover:border-zinc-400">
                <CardHeader>
                  <CardTitle>{trip.name}</CardTitle>
                  {(trip.startDate || trip.endDate) && (
                    <CardDescription>
                      {trip.startDate ?? "?"} 〜 {trip.endDate ?? "?"}
                    </CardDescription>
                  )}
                  {trip.description && (
                    <CardDescription className="line-clamp-2">
                      {trip.description}
                    </CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
