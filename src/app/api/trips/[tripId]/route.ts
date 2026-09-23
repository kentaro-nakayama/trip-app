import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { trips } from "@/db/schema";
import { getTripRole, hasAtLeastRole } from "@/lib/access";
import { MAX_TRIP_SPAN_DAYS, dateRange, syncItineraryDaysToDateRange } from "@/lib/itinerary-days";
import { loadTripDetail } from "@/lib/trip-detail";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const role = await getTripRole(tripId, userId);
  if (!role) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const detail = await loadTripDetail(tripId, role);
  if (!detail) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(detail);
}

const updateTripSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const role = await getTripRole(tripId, userId);
  if (!hasAtLeastRole(role, "editor")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = updateTripSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const [trip] = await db
    .update(trips)
    .set({
      name: parsed.data.name,
      startDate: parsed.data.startDate ?? null,
      endDate: parsed.data.endDate ?? null,
      updatedAt: new Date(),
    })
    .where(eq(trips.id, tripId))
    .returning();

  if (!trip) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await syncItineraryDaysToDateRange(trip.id, trip.startDate, trip.endDate);

  return NextResponse.json(trip);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const role = await getTripRole(tripId, userId);
  if (role !== "owner") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = getDb();
  await db.delete(trips).where(eq(trips.id, tripId));

  return NextResponse.json({ ok: true });
}
