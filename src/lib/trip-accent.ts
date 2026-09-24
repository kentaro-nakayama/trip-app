// Pastel palette (one shade per hue family, matched for consistent
// saturation/lightness) referenced from https://hibicolor.com/hibilab/pastel-color/
const ACCENTS = [
  "border-[#FFB3B3]", // 赤（コーラル）
  "border-[#FFDCB3]", // オレンジ
  "border-[#FFF4B3]", // 黄
  "border-[#A6E1CA]", // 緑
  "border-[#9CC7C5]", // 青緑
  "border-[#A6D8E4]", // 青
  "border-[#D3BCE8]", // 紫
  "border-[#FFB6C1]", // ピンク
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
