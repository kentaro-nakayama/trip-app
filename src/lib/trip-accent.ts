const ACCENTS = [
  "border-sky-500",
  "border-violet-500",
  "border-rose-500",
  "border-orange-500",
  "border-emerald-500",
  "border-lime-600",
  "border-blue-600",
  "border-fuchsia-500",
];

function hashToIndex(id: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

/** Deterministically picks a border accent color for a single trip, based on its id. */
export function getTripAccent(tripId: string): string {
  return ACCENTS[hashToIndex(tripId, ACCENTS.length)];
}

/**
 * Assigns a border accent color to each trip id, avoiding duplicates within the
 * same list as long as there are enough colors to go around.
 */
export function assignTripAccents(tripIds: string[]): Map<string, string> {
  const used = new Set<number>();
  const result = new Map<string, string>();

  for (const id of tripIds) {
    let index = hashToIndex(id, ACCENTS.length);
    while (used.has(index) && used.size < ACCENTS.length) {
      index = (index + 1) % ACCENTS.length;
    }
    used.add(index);
    result.set(id, ACCENTS[index]);
  }

  return result;
}
