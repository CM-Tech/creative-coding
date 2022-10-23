import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";
import fragsource from "./frag.glsl?raw";
import vertsource from "./vert.glsl?raw";

function main(canvas: HTMLCanvasElement, btn: HTMLParagraphElement, audio: HTMLAudioElement) {
  const MIN_RADIUS = 32;
  let JITTER_RANGE =
    window.innerHeight <= window.innerWidth ? window.innerHeight / 2 - MIN_RADIUS : window.innerWidth / 2 - MIN_RADIUS;
  JITTER_RANGE = JITTER_RANGE * 1.2;
  const NUM_NODES = 256; // only 1/2 of these are actually drawn

  // derived
  let points: { x: number; y: number }[] = [];
  let wdraw: number[] = [];
  const mouse = {
    x: 0.5,
    y: 0.5,
  };

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext("webgl")!;

  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;

  gl.shaderSource(vertexShader, vertsource);
  gl.shaderSource(fragmentShader, fragsource);

  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);

  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const ptime = gl.getUniformLocation(program, "time");
  const presolution = gl.getUniformLocation(program, "resolution");
  const pmouse = gl.getUniformLocation(program, "mouse");
  const pposition = gl.getAttribLocation(program, "vertPosition");

  function xyFromPolar(r: number, theta: number) {
    const x = Math.round(r / 1) * 1 * Math.cos(theta);
    const y = Math.round(r / 1) * 1 * Math.sin(theta);
    points.push({
      x: (x * 2) / window.innerWidth,
      y: (y * 2) / window.innerHeight,
    });
  }

  function stamp(db: number, i: number) {
    const r = MIN_RADIUS + (db * JITTER_RANGE) / 255;
    const theta = ((i - 2) / (NUM_NODES - 2.0)) * Math.PI + Math.PI / 4.0;
    xyFromPolar(r, theta);
  }

  function stamp2(db: number, i: number) {
    const r = MIN_RADIUS + (db * JITTER_RANGE) / 255;
    const theta = Math.PI - (i / NUM_NODES) * Math.PI - Math.PI / 4.0;
    xyFromPolar(r, theta);
  }

  function update(analyser: AnalyserNode) {
    const freqArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqArray);
    points = [];
    wdraw = [];
    // the bottom 1/8 and top 3/8 of this song are pretty boring...
    for (let i = NUM_NODES / 8; i <= (NUM_NODES * 5) / 8; i += 2) {
      stamp(freqArray[i], i << 0);
      stamp(freqArray[i], i << 1);
      stamp(freqArray[i], i << 2);
    }
    for (let i = NUM_NODES / 8; i <= (NUM_NODES * 5) / 8; i += 2) {
      stamp2(freqArray[i], i << 0);
      stamp2(freqArray[i], i << 1);
      stamp2(freqArray[i], i << 2);
    }
    points.forEach((element, index, array) => {
      if (array[index + 1]) {
        wdraw.push(element.x, element.y, array[index + 1].x, array[index + 1].y, 0, 0);
      } else {
        wdraw.push(element.x, element.y, array[0].x, array[0].y, 0, 0);
      }
    });
    render();
  }

  let time = 0;

  function render() {
    gl.clearColor(56 / 255, 35 / 255, 37 / 255, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(wdraw), gl.STATIC_DRAW);
    gl.useProgram(program);

    gl.uniform1f(ptime, time / 50);
    gl.uniform2f(presolution, window.innerWidth, window.innerHeight);
    gl.uniform2f(pmouse, mouse.x, 1 - mouse.y);
    gl.enableVertexAttribArray(pposition);
    gl.vertexAttribPointer(pposition, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, wdraw.length / 2);
    time++;
  }

  window.onmousemove = (e) => {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
  };
  window.onresize = () => {
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    JITTER_RANGE =
      window.innerHeight <= window.innerWidth
        ? window.innerHeight / 2 - MIN_RADIUS
        : window.innerWidth / 2 - MIN_RADIUS;
  };

  audio.oncanplay = () => {
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const sourceNode = audioContext.createMediaElementSource(audio);
    analyser.smoothingTimeConstant = 0.6;
    analyser.fftSize = NUM_NODES * 2;
    analyser.minDecibels = -90;
    analyser.maxDecibels = -10;
    analyser.connect(audioContext.destination);
    sourceNode.connect(analyser);
    createAnimationFrame(update.bind(null, analyser));

    btn.textContent = audio.paused ? "▶️" : "⏸";
    window.onclick = () => {
      audioContext.resume();
      audio.paused ? audio.play() : audio.pause();
      btn.textContent = audio.paused ? "▶️" : "⏸";
    };
    render();
  };
}
export const MonsterSound = () => {
  let c: HTMLCanvasElement;
  let btn: HTMLParagraphElement;
  let audio: HTMLAudioElement;
  onMount(() => {
    main(c, btn, audio);
  });
  return (
    <>
      <audio ref={audio!} src="/sounds/Monsters.mp3" crossOrigin="anonymous" loop />
      <canvas style={{ background: "rgb(56, 35, 37)" }} ref={c!} />
      <p class="btn" ref={btn!}>
        Loading...
      </p>
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = ``;
export const MonsterSoundExperiment: Experiment = { title: "Monster Sound", component: MonsterSound, imgUrl, description };
