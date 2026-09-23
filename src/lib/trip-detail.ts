import "server-only";
import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { itineraryDays, spots, tripMembers, trips } from "@/db/schema";
import type { TripDetail } from "./types";
import type { TripRole } from "./access";

export async function loadTripDetail(
  tripId: string,
  role: TripRole,
): Promise<TripDetail | null> {
  const db = getDb();

  const [trip] = await db.select().from(trips).where(eq(trips.id, tripId)).limit(1);
  if (!trip) return null;

  const members = await db
    .select({ id: tripMembers.id, userId: tripMembers.userId, role: tripMembers.role })
    .from(tripMembers)
    .where(eq(tripMembers.tripId, tripId));

  const tripSpots = await db
    .select()
    .from(spots)
    .where(eq(spots.tripId, tripId))
    .orderBy(asc(spots.createdAt));

  const days = await db.query.itineraryDays.findMany({
    where: eq(itineraryDays.tripId, tripId),
    orderBy: asc(itineraryDays.dayIndex),
    with: {
      items: {
        orderBy: (item, { asc }) => asc(item.order),
        with: { spot: true },
      },
    },
  });

  return {
    id: trip.id,
    name: trip.name,
    description: trip.description,
    startDate: trip.startDate,
    endDate: trip.endDate,
    ownerId: trip.ownerId,
    myRole: role,
    members,
    spots: tripSpots.map((s) => ({
      id: s.id,
      tripId: s.tripId,
      name: s.name,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      googlePlaceId: s.googlePlaceId,
      notes: s.notes,
      createdByUserId: s.createdByUserId,
      createdAt: s.createdAt.toISOString(),
    })),
    days: days.map((d) => ({
      id: d.id,
      tripId: d.tripId,
      date: d.date,
      dayIndex: d.dayIndex,
      items: d.items.map((it) => ({
        id: it.id,
        itineraryDayId: it.itineraryDayId,
        spotId: it.spotId,
        order: it.order,
        spot: {
          id: it.spot.id,
          tripId: it.spot.tripId,
          name: it.spot.name,
          address: it.spot.address,
          lat: it.spot.lat,
          lng: it.spot.lng,
          googlePlaceId: it.spot.googlePlaceId,
          notes: it.spot.notes,
          createdByUserId: it.spot.createdByUserId,
          createdAt: it.spot.createdAt.toISOString(),
        },
      })),
    })),
  };
}
