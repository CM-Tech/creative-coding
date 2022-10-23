import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

const main = (chars: HTMLDivElement, audio: HTMLAudioElement) => {
  const dt = ["̄", "̅"];
  const db = ["̱", "̲"];

  const amount = 32;

  const audioContext = new AudioContext();
  let anim: number;

  const analyser = audioContext.createAnalyser();
  const source = audioContext.createMediaElementSource(audio);

  source.connect(analyser);
  analyser.connect(audioContext.destination);

  analyser.smoothingTimeConstant = 0.6;
  analyser.fftSize = amount * 2;
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;

  let playing = false;

  window.addEventListener("click", () => {
    audioContext.resume();
    playing ? audio.pause() : audio.play();
    playing ? window.cancelAnimationFrame(anim) : update();
    playing = !playing;
  });

  function update() {
    const freqArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqArray);
    let ac = "";
    let red = false;

    for (let i = amount / 8; i < (amount * 7) / 8; i++) {
      ac += audio.currentTime / audio.duration < i / ((amount * 3) / 4) ? "▓" : "░";
      for (let d = 0; d < freqArray[i] / 2; d++) {
        ac += dt[Math.floor(Math.random() * 2)];
        ac += db[Math.floor(Math.random() * 2)];
      }
      if (freqArray[i] > 130) red = true;
    }
    if (red) {
      document.body.style.background = "black";
      chars.style.color = "white";
    } else {
      document.body.style.background = "white";
      chars.style.color = "black";
    }
    chars.innerText = ac;
  }

  createAnimationFrame(update);
};

export const DiacriticSound = () => {
  let audio: HTMLAudioElement;
  let chars: HTMLDivElement;
  onMount(() => {
    main(chars, audio);
  });
  return (
    <>
      <audio crossOrigin="anonymous" src="/sounds/XX-Intro.mp3" loop ref={audio!}></audio>
      <div class="chars" ref={chars!}>
        Loading...
      </div>
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = ``;
export const DiacriticSoundExperiment: Experiment = {
  title: "Diacritic Sound",
  component: DiacriticSound,
  imgUrl,
  description,
};
