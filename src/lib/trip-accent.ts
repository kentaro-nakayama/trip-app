// Tonal ramp built from the app's own main color (--primary, rgb(78,71,221)
// / #4E47DD — the same purple used for primary buttons, the active tab, and
// the hint bubble), from a near-black shade up to a near-white tint, so the
// card glow always reads as "this app's color" rather than an unrelated hue.
// Two blurred shadow layers per color: a small "core" glow close to the
// edge, plus a softer, wider bloom. Each color's alpha is tuned individually
// — darker shades get a lower alpha, paler tints get a higher one — so all
// six read with roughly the same visual weight at rest, and intensify by a
// similar amount on hover.
const ACCENTS = [
  // 最も暗いシェード
  "shadow-[0_0_4px_0px_#1B194D4A,0_0_12px_-3px_#1B194D70] hover:shadow-[0_0_5px_0px_#1B194D70,0_0_14px_-3px_#1B194D96]",
  // ダークシェード
  "shadow-[0_0_4px_0px_#2F2B8558,0_0_12px_-3px_#2F2B8582] hover:shadow-[0_0_5px_0px_#2F2B857E,0_0_14px_-3px_#2F2B85A8]",
  // メインカラー
  "shadow-[0_0_4px_0px_#4E47DD66,0_0_12px_-3px_#4E47DD94] hover:shadow-[0_0_5px_0px_#4E47DD8C,0_0_14px_-3px_#4E47DDBA]",
  // ライトティント
  "shadow-[0_0_4px_0px_#7A75E682,0_0_12px_-3px_#7A75E6C0] hover:shadow-[0_0_5px_0px_#7A75E6A8,0_0_14px_-3px_#7A75E6E4]",
  // ペールティント
  "shadow-[0_0_4px_0px_#A7A3EE9E,0_0_12px_-3px_#A7A3EE] hover:shadow-[0_0_5px_0px_#A7A3EEC4,0_0_14px_-3px_#A7A3EE]",
  // 最も淡いティント
  "shadow-[0_0_4px_0px_#D3D1F7BA,0_0_12px_-3px_#D3D1F7] hover:shadow-[0_0_5px_0px_#D3D1F7E0,0_0_14px_-3px_#D3D1F7]",
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
