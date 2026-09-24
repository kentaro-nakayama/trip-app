/** Formats a minute count as "1時間30分" / "2時間" / "45分". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}分`;
  if (mins === 0) return `${hours}時間`;
  return `${hours}時間${mins}分`;
}

/** Adds minutes to an "HH:MM" time string, wrapping past midnight. */
export function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = (((h * 60 + m + minutes) % 1440) + 1440) % 1440;
  const nextH = Math.floor(total / 60);
  const nextM = total % 60;
  return `${String(nextH).padStart(2, "0")}:${String(nextM).padStart(2, "0")}`;
}

/** Converts an "HH:MM" time string to minutes since midnight. */
export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Minutes elapsed from `from` to `to` (both "HH:MM"), assuming `to` is on the
 * same day or wraps to the next day (never more than 24h later).
 */
export function minutesBetween(from: string, to: string): number {
  const f = timeToMinutes(from);
  const t = timeToMinutes(to);
  return t >= f ? t - f : t + 1440 - f;
}
