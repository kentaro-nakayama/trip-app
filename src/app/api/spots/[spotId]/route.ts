import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { savedSpots, spotLists } from "@/db/schema";

const updateSpotSchema = z.object({
  name: z.string().trim().min(1).max(200),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ spotId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotId } = await params;
  const parsed = updateSpotSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const [owned] = await db
    .select({ id: savedSpots.id })
    .from(savedSpots)
    .innerJoin(spotLists, eq(savedSpots.spotListId, spotLists.id))
    .where(and(eq(savedSpots.id, spotId), eq(spotLists.userId, userId)))
    .limit(1);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [spot] = await db
    .update(savedSpots)
    .set({
      name: parsed.data.name,
      notes: parsed.data.notes ?? null,
      updatedAt: new Date(),
    })
    .where(eq(savedSpots.id, spotId))
    .returning();

  return NextResponse.json(spot);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ spotId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotId } = await params;
  const db = getDb();
  const [owned] = await db
    .select({ id: savedSpots.id })
    .from(savedSpots)
    .innerJoin(spotLists, eq(savedSpots.spotListId, spotLists.id))
    .where(and(eq(savedSpots.id, spotId), eq(spotLists.userId, userId)))
    .limit(1);
  if (!owned) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await db.delete(savedSpots).where(eq(savedSpots.id, spotId));

  return NextResponse.json({ ok: true });
}
