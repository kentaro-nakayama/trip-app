import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { itineraryDays, itineraryItems } from "@/db/schema";
import { getTripRole, hasAtLeastRole } from "@/lib/access";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ tripId: string; itemId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId, itemId } = await params;
  const role = await getTripRole(tripId, userId);
  if (!hasAtLeastRole(role, "editor")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const db = getDb();

  const [item] = await db
    .select({ id: itineraryItems.id })
    .from(itineraryItems)
    .innerJoin(itineraryDays, eq(itineraryItems.itineraryDayId, itineraryDays.id))
    .where(and(eq(itineraryItems.id, itemId), eq(itineraryDays.tripId, tripId)))
    .limit(1);
  if (!item) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db.delete(itineraryItems).where(eq(itineraryItems.id, itemId));

  return NextResponse.json({ ok: true });
}
