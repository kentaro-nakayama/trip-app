type DatedTrip = { startDate: string | null };

/** Today's date as "YYYY-MM-DD" in the local timezone. */
function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Orders trips so the soonest upcoming trip comes first, then past trips
 * (most recently completed first), then trips with no date at all.
 */
export function sortTripsByUpcoming<T extends DatedTrip>(tripList: T[]): T[] {
  const today = todayDateString();

  return [...tripList].sort((a, b) => {
    if (a.startDate == null && b.startDate == null) return 0;
    if (a.startDate == null) return 1;
    if (b.startDate == null) return -1;

    const aUpcoming = a.startDate >= today;
    const bUpcoming = b.startDate >= today;
    if (aUpcoming && bUpcoming) return a.startDate.localeCompare(b.startDate);
    if (!aUpcoming && !bUpcoming) return b.startDate.localeCompare(a.startDate);
    return aUpcoming ? -1 : 1;
  });
}
