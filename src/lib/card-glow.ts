// Shared glow for every card (trip, spot list), matching the app's main
// color (rgb(76, 71, 205) / #4C47CD) so every card reads as one consistent
// style instead of a per-item color. Two blurred shadow layers: a small
// "core" ring right at the edge, plus a softer, wider bloom that fades into
// the page background.
export const CARD_GLOW =
  "shadow-[0_0_3px_0px_#4C47CD99,0_0_12px_-2px_#4C47CD80] hover:shadow-[0_0_4px_0px_#4C47CDCC,0_0_15px_-2px_#4C47CDAA]";

// Ambient glow for the primary "create" buttons (new trip / new spot list),
// brighter and more layered than CARD_GLOW: a lit border plus three stacked
// shadow layers (tight core, mid bloom, wide ambient falloff) for a
// neon-adjacent but still soft look.
export const CREATE_BUTTON_GLOW =
  "border-[1.25px] border-[#9F97FFBF] shadow-[0_0_5px_0.5px_#817AF5B3,0_0_18px_3px_#4C47CD80,0_0_30px_5px_#4C47CD47] hover:border-[#9F97FFE0] hover:shadow-[0_0_6px_1px_#817AF5CC,0_0_20px_4px_#4C47CD99,0_0_34px_6px_#4C47CD59]";
