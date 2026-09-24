import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { savedSpots, spotLists } from "@/db/schema";
import type { SpotListDetail } from "./types";

export async function loadSpotListDetail(
  spotListId: string,
  userId: string,
): Promise<SpotListDetail | null> {
  const db = getDb();
  const [spotList] = await db
    .select()
    .from(spotLists)
    .where(and(eq(spotLists.id, spotListId), eq(spotLists.userId, userId)))
    .limit(1);
  if (!spotList) return null;

  const spots = await db
    .select()
    .from(savedSpots)
    .where(eq(savedSpots.spotListId, spotListId))
    .orderBy(asc(savedSpots.createdAt));

  return {
    id: spotList.id,
    name: spotList.name,
    description: spotList.description,
    spots: spots.map((s) => ({
      id: s.id,
      spotListId: s.spotListId,
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      googlePlaceId: s.googlePlaceId,
      notes: s.notes,
      createdAt: s.createdAt.toISOString(),
    })),
  };
}
