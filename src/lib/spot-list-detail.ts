import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { savedSpots, spotListMembers, spotLists } from "@/db/schema";
import type { SpotListDetail } from "./types";
import type { TripRole } from "./access";

export async function loadSpotListDetail(
  spotListId: string,
  role: TripRole,
): Promise<SpotListDetail | null> {
  const db = getDb();

  const [spotList] = await db
    .select()
    .from(spotLists)
    .where(eq(spotLists.id, spotListId))
    .limit(1);
  if (!spotList) return null;

  const members = await db
    .select({ id: spotListMembers.id, userId: spotListMembers.userId, role: spotListMembers.role })
    .from(spotListMembers)
    .where(eq(spotListMembers.spotListId, spotListId));

  const spots = await db
    .select()
    .from(savedSpots)
    .where(eq(savedSpots.spotListId, spotListId))
    .orderBy(asc(savedSpots.createdAt));

  return {
    id: spotList.id,
    name: spotList.name,
    description: spotList.description,
    ownerId: spotList.userId,
    myRole: role,
    members,
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
