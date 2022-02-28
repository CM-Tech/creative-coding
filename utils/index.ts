import { onCleanup } from "solid-js";

export function createAnimationFrame(callback: (() => void) | ((t: number) => void)) {
  let y = requestAnimationFrame(function x(t: number) {
    callback(t);
    y = requestAnimationFrame(x);
  });
  onCleanup(() => {
    cancelAnimationFrame(y);
  });
}
