// Chic blue/white theme: a tonal ramp of blues, staying within one cohesive
// monochrome-blue family (no near-black — kept purely blue).
// No crisp ring/border at all. Two blurred shadow layers per color: a small
// "core" glow close to the edge, plus a softer, wider bloom. Both used to be
// the same alpha for every color, which made the darker hues (which contrast
// far more against a white card) look much more prominent than the pale
// ones. Each color's alpha is now tuned individually — darker hues get a
// lower alpha, paler hues get a higher one — so all five read with roughly
// the same visual weight at rest, and intensify by a similar amount on hover.
const ACCENTS = [
  // ダークネイビー
  "shadow-[0_0_4px_0px_#1F3A5F33,0_0_12px_-3px_#1F3A5F59] hover:shadow-[0_0_5px_0px_#1F3A5F59,0_0_14px_-3px_#1F3A5F80]",
  // ミッドブルー
  "shadow-[0_0_4px_0px_#2F5C8A47,0_0_12px_-3px_#2F5C8A73] hover:shadow-[0_0_5px_0px_#2F5C8A6E,0_0_14px_-3px_#2F5C8A99]",
  // ブルー
  "shadow-[0_0_4px_0px_#4A80B559,0_0_12px_-3px_#4A80B594] hover:shadow-[0_0_5px_0px_#4A80B580,0_0_14px_-3px_#4A80B5BA]",
  // ライトブルー
  "shadow-[0_0_4px_0px_#7FADD67A,0_0_12px_-3px_#7FADD6C7] hover:shadow-[0_0_5px_0px_#7FADD6A1,0_0_14px_-3px_#7FADD6ED]",
  // ペールブルー
  "shadow-[0_0_4px_0px_#BBD6EC99,0_0_12px_-3px_#BBD6EC] hover:shadow-[0_0_5px_0px_#BBD6ECBF,0_0_14px_-3px_#BBD6EC]",
];

function hashToIndex(id: string, mod: number): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }
  return hash % mod;
}

/** Deterministically picks a glow accent color for a single trip, based on its id. */
export function getTripAccent(tripId: string): string {
  return ACCENTS[hashToIndex(tripId, ACCENTS.length)];
}

/**
 * Assigns a glow accent color to each trip id, avoiding duplicates within the
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
