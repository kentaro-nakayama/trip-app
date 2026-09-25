import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/db";
import { savedSpots, spotListMembers, spotLists } from "@/db/schema";
import type { SpotListSummary } from "@/lib/types";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = await db
    .select({
      id: spotLists.id,
      name: spotLists.name,
      description: spotLists.description,
      spotCount: sql<number>`count(distinct ${savedSpots.id})`.mapWith(Number),
    })
    .from(spotListMembers)
    .innerJoin(spotLists, eq(spotListMembers.spotListId, spotLists.id))
    .leftJoin(savedSpots, eq(savedSpots.spotListId, spotLists.id))
    .where(eq(spotListMembers.userId, userId))
    .groupBy(spotLists.id)
    .orderBy(desc(spotLists.createdAt));

  const result: SpotListSummary[] = rows;
  return NextResponse.json(result);
}

const createSpotListSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSpotListSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const db = getDb();
  const [spotList] = await db
    .insert(spotLists)
    .values({
      userId,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
    })
    .returning();

  await db.insert(spotListMembers).values({
    spotListId: spotList.id,
    userId,
    role: "owner",
  });

  return NextResponse.json(spotList, { status: 201 });
}
