import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { getDb } from "@/db";
import { spots } from "@/db/schema";
import { getTripRole, hasAtLeastRole } from "@/lib/access";

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
  { params }: { params: Promise<{ tripId: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { tripId } = await params;
  const role = await getTripRole(tripId, userId);
  if (!hasAtLeastRole(role, "editor")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const parsed = createSpotSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const [spot] = await db
    .insert(spots)
    .values({
      tripId,
      name: parsed.data.name,
      address: parsed.data.address ?? null,
      lat: parsed.data.lat,
      lng: parsed.data.lng,
      googlePlaceId: parsed.data.googlePlaceId ?? null,
      notes: parsed.data.notes ?? null,
      createdByUserId: userId,
    })
    .returning();

  return NextResponse.json(spot, { status: 201 });
}
