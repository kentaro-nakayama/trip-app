import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { itineraryDays } from "@/db/schema";
import { getTripRole, hasAtLeastRole } from "@/lib/access";

export async function POST(
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

  const body = await req.json().catch(() => ({}));
  const date = typeof body?.date === "string" ? body.date : undefined;

  const db = getDb();
  const [last] = await db
    .select({ dayIndex: itineraryDays.dayIndex })
    .from(itineraryDays)
    .where(eq(itineraryDays.tripId, tripId))
    .orderBy(desc(itineraryDays.dayIndex))
    .limit(1);

  const [day] = await db
    .insert(itineraryDays)
    .values({ tripId, date: date ?? null, dayIndex: (last?.dayIndex ?? -1) + 1 })
    .returning();

  return NextResponse.json({ ...day, items: [] }, { status: 201 });
}
