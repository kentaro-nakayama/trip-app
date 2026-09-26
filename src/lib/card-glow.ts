// Ambient glow shared by every card and primary interactive surface (trip
// cards, spot list cards, create buttons, the profile icon), matching the
// app's main color (rgb(76, 71, 205) / #4C47CD): a lit border plus three
// stacked shadow layers (tight core, mid bloom, wide ambient falloff) for a
// neon-adjacent but still soft look.
export const CREATE_BUTTON_GLOW =
  "border-[1.25px] border-[#9F97FF99] shadow-[0_0_4px_0px_#817AF58C,0_0_14px_2px_#4C47CD5C,0_0_24px_4px_#4C47CD30] hover:border-[#9F97FFB3] hover:shadow-[0_0_5px_0.5px_#817AF5A3,0_0_16px_3px_#4C47CD73,0_0_28px_5px_#4C47CD3D]";
