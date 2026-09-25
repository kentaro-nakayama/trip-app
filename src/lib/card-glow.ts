// Shared glow for every card (trip, spot list), matching the app's main
// color (rgb(76, 71, 205) / #4C47CD) so every card reads as one consistent
// style instead of a per-item color. Two blurred shadow layers: a small
// "core" ring right at the edge, plus a softer, wider bloom that fades into
// the page background.
export const CARD_GLOW =
  "shadow-[0_0_3px_0px_#4C47CD99,0_0_12px_-2px_#4C47CD80] hover:shadow-[0_0_4px_0px_#4C47CDCC,0_0_15px_-2px_#4C47CDAA]";
