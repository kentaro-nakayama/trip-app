import "server-only";
import { desc, eq, inArray } from "drizzle-orm";
import { getDb } from "@/db";
import { itineraryDays, itineraryItems } from "@/db/schema";

export const MAX_TRIP_SPAN_DAYS = 60;

/** Inclusive list of "YYYY-MM-DD" dates from start to end. */
export function dateRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(`${start}T00:00:00Z`);
  const endDate = new Date(`${end}T00:00:00Z`);
  while (cur <= endDate) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Keeps a trip's itinerary_days in sync with its date range.
 *
 * Existing days created before a date range existed (or from a since-shrunk
 * range) have `date: null`. Rather than leaving them alongside a whole new
 * set of dated days — which would duplicate every "day" as an empty new tab
 * next to the real one still holding its spots — this "adopts" dateless
 * days into the range in their existing order, assigning each the earliest
 * date not already claimed by a dated day. Only genuinely uncovered dates
 * get newly created days, and only empty *dated* days outside the range are
 * removed, so a day with spots in it is never silently deleted.
 *
 * A no-op when either date is missing.
 */
export async function syncItineraryDaysToDateRange(
  tripId: string,
  startDate: string | null,
  endDate: string | null,
) {
  if (!startDate || !endDate) return;

  const db = getDb();
  const desiredDates = [...new Set(dateRange(startDate, endDate))].sort();
  const desiredDatesSet = new Set(desiredDates);

  const existingDays = await db
    .select({ id: itineraryDays.id, date: itineraryDays.date, dayIndex: itineraryDays.dayIndex })
    .from(itineraryDays)
    .where(eq(itineraryDays.tripId, tripId))
    .orderBy(itineraryDays.dayIndex);

  const existingDatedDates = new Set(
    existingDays.filter((d) => d.date).map((d) => d.date as string),
  );

  // Adopt dateless legacy days into the earliest unclaimed dates, in their
  // existing order, so day 1's spots land on the range's first date.
  const unclaimedDates = desiredDates.filter((d) => !existingDatedDates.has(d));
  const dateAssignments = new Map<string, string>(); // dayId -> date
  for (const day of existingDays) {
    if (day.date || unclaimedDates.length === 0) continue;
    dateAssignments.set(day.id, unclaimedDates.shift()!);
  }
  if (dateAssignments.size > 0) {
    const assignDate = (dayId: string, date: string) =>
      db.update(itineraryDays).set({ date }).where(eq(itineraryDays.id, dayId));
    const assignments = [...dateAssignments.entries()];
    await db.batch(
      assignments.map(([dayId, date]) => assignDate(dayId, date)) as [
        ReturnType<typeof assignDate>,
        ...ReturnType<typeof assignDate>[],
      ],
    );
    for (const [, date] of assignments) existingDatedDates.add(date);
  }

  const datesToAdd = unclaimedDates;

  const staleDayIds = existingDays
    .filter((d) => d.date && !desiredDatesSet.has(d.date) && !dateAssignments.has(d.id))
    .map((d) => d.id);

  if (staleDayIds.length > 0) {
    const itemsInStaleDays = await db
      .select({ dayId: itineraryItems.itineraryDayId })
      .from(itineraryItems)
      .where(inArray(itineraryItems.itineraryDayId, staleDayIds));
    const daysWithItems = new Set(itemsInStaleDays.map((row) => row.dayId));
    const emptyStaleDayIds = staleDayIds.filter((id) => !daysWithItems.has(id));

    if (emptyStaleDayIds.length > 0) {
      const deleteDay = (id: string) => db.delete(itineraryDays).where(eq(itineraryDays.id, id));
      await db.batch(
        emptyStaleDayIds.map(deleteDay) as [
          ReturnType<typeof deleteDay>,
          ...ReturnType<typeof deleteDay>[],
        ],
      );
    }
  }

  if (datesToAdd.length > 0) {
    const [last] = await db
      .select({ dayIndex: itineraryDays.dayIndex })
      .from(itineraryDays)
      .where(eq(itineraryDays.tripId, tripId))
      .orderBy(desc(itineraryDays.dayIndex))
      .limit(1);

    let nextIndex = (last?.dayIndex ?? -1) + 1;
    datesToAdd.sort();
    const insertDay = (date: string) =>
      db.insert(itineraryDays).values({ tripId, date, dayIndex: nextIndex++ });
    await db.batch(
      datesToAdd.map(insertDay) as [
        ReturnType<typeof insertDay>,
        ...ReturnType<typeof insertDay>[],
      ],
    );
  }
}
