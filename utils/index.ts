import { createSignal, onCleanup, onMount } from "solid-js";

export function createAnimationFrame(callback: (() => void) | ((t: number) => void)) {
  let y = requestAnimationFrame(function x(t: number) {
    callback(t);
    y = requestAnimationFrame(x);
  });
  onCleanup(() => {
    cancelAnimationFrame(y);
  });
}

export const createSizeSignal = () => {
  const [windowWidth, setWindowWidth] = createSignal(window.innerWidth);
  const [windowHeight, setWindowHeight] = createSignal(window.innerHeight);
  const [DP, setDP] = createSignal(window.devicePixelRatio ?? 1);
  onMount(() => {
    const handler = () => {
      setWindowWidth(window.innerWidth);
      setWindowHeight(window.innerHeight);
      setDP(window.devicePixelRatio ?? 1);
    };
    window.addEventListener("resize", handler);
    onCleanup(() => {
      window.removeEventListener("resize", handler);
    })
  });
  return { width: windowWidth, height: windowHeight, dpr: DP };
}