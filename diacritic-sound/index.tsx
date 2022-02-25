import "./style.css";
import { onMount } from "solid-js";

const main = (chars: HTMLDivElement, audio: HTMLAudioElement) => {
  let dt = ["̄", "̅͡"];
  let db = ["̱", "̲"];

  let amount = 32;

  let audioContext = new AudioContext();
  let anim: number;

  window.addEventListener("load", () => {
    let analyser = audioContext.createAnalyser();
    let source = audioContext.createMediaElementSource(audio);

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
      playing ? window.cancelAnimationFrame(anim) : update(analyser);
      playing = !playing;
    });

    update(analyser);
  });

  function update(analyser: AnalyserNode) {
    let freqArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqArray);
    let ac = "";
    let red = false;

    for (let i = amount / 8; i < (amount * 7) / 8; i++) {
      ac += audio.currentTime / audio.duration < i / ((amount * 3) / 4) ? "▓" : "░";
      for (let d = 0; d < freqArray[i]; d++) {
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
    anim = window.requestAnimationFrame(update.bind(null, analyser));
  }
};

export const DiacriticSound = () => {
  let audio: HTMLAudioElement;
  let chars: HTMLDivElement;
  onMount(() => {
    main(chars, audio);
  });
  return (
    <>
      <audio
        id="audio"
        crossOrigin="anonymous"
        src="https://s3-us-west-2.amazonaws.com/s.cdpn.io/1715/the_xx_-_intro.mp3"
        loop
        ref={audio!}
      ></audio>
      <div id="chars" ref={chars!}>
        Loading...
      </div>
    </>
  );
};
