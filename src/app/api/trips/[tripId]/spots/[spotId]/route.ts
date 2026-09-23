import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { spots } from "@/db/schema";
import { getTripRole, hasAtLeastRole } from "@/lib/access";

const updateSpotSchema = z.object({
  notes: z.string().trim().max(2000).nullable(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ tripId: string; spotId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId, spotId } = await params;
  const role = await getTripRole(tripId, userId);
  if (!hasAtLeastRole(role, "editor")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = updateSpotSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();

  const [spot] = await db
    .update(spots)
    .set({ notes: parsed.data.notes || null })
    .where(and(eq(spots.id, spotId), eq(spots.tripId, tripId)))
    .returning();

  if (!spot) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return NextResponse.json(spot);
}
