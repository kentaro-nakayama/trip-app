import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { savedSpots, spotLists } from "@/db/schema";

const createSpotSchema = z.object({
  name: z.string().trim().min(1).max(200),
  address: z.string().trim().max(500).optional(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  googlePlaceId: z.string().max(300).optional(),
  notes: z.string().trim().max(2000).optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ spotListId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { spotListId } = await params;
  const db = getDb();
  const [spotList] = await db
    .select({ id: spotLists.id })
    .from(spotLists)
    .where(and(eq(spotLists.id, spotListId), eq(spotLists.userId, userId)))
    .limit(1);
  if (!spotList) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const parsed = createSpotSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [spot] = await db
    .insert(savedSpots)
    .values({
      spotListId,
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      googlePlaceId: parsed.data.googlePlaceId ?? null,
      notes: parsed.data.notes ?? null,
    })
    .returning();

  return NextResponse.json(spot, { status: 201 });
}
