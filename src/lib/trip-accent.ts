// Chic black/blue/white theme: a tonal ramp from near-black navy down to
// pale ice blue, staying within one cohesive monochrome-blue family.
const ACCENTS = [
  "border-[#0F1B2D]", // ほぼ黒（ネイビーブラック）
  "border-[#1F3A5F]", // ダークネイビー
  "border-[#2F5C8A]", // ミッドブルー
  "border-[#4A80B5]", // ブルー
  "border-[#7FADD6]", // ライトブルー
  "border-[#BBD6EC]", // ペールブルー
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
