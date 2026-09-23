import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { trips, tripMembers } from "@/db/schema";
import { MAX_TRIP_SPAN_DAYS, dateRange, syncItineraryDaysToDateRange } from "@/lib/itinerary-days";
import type { TripSummary } from "@/lib/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db
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

  const result: TripSummary[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.startDate,
    endDate: row.endDate,
    myRole: row.role,
  }));

  return NextResponse.json(result);
}

const createTripSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: "終了日は開始日以降にしてください", path: ["endDate"] },
  )
  .refine(
    (data) =>
      !data.startDate ||
      !data.endDate ||
      dateRange(data.startDate, data.endDate).length <= MAX_TRIP_SPAN_DAYS,
    { message: `旅行期間は${MAX_TRIP_SPAN_DAYS}日以内にしてください`, path: ["endDate"] },
  );

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createTripSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const [trip] = await db
    .insert(trips)
    .values({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
      ownerId: userId,
    })
    .returning();

  await db.insert(tripMembers).values({
    tripId: trip.id,
    userId,
    role: "owner",
  });

  await syncItineraryDaysToDateRange(trip.id, trip.startDate, trip.endDate);

  return NextResponse.json(trip, { status: 201 });
}
