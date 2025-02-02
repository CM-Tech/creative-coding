import chroma from "chroma-js";
export const CYAN_MUL = "#55EEEE";
export const YELLOW_MUL = "#EEBB66";
export const MAGENTA_MUL = "#EE55EE";
export const BASE_LIGHT = "#EBE8E7";
export const BASE_DARK = "#312D32";
const WHITE = BASE_LIGHT;
export const PALETTE = {
  WHITE,
  WHITISH: "#E2E0D8",
  WHITER: "#FFFEFD",
  BLACK: BASE_DARK,
  HUES: [
    chroma.blend(CYAN_MUL, WHITE, "multiply").hex(),
    chroma.blend(MAGENTA_MUL, WHITE, "multiply").hex(),
    chroma.blend(YELLOW_MUL, WHITE, "multiply").hex(),
  ], //', "#E35362", "#E5CC5C"],
};

export const COLOR_MUL = PALETTE.HUES.map((x) => {
  let a = chroma(x).rgb(false);
  let b = chroma(PALETTE.WHITE).rgb(false);
  return chroma
    .rgb(Math.min(a[0] / b[0], 1) * 255, Math.min(a[1] / b[1], 1) * 255, Math.min(a[2] / b[2], 1) * 255)
    .hex();
});
