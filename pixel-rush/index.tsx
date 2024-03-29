import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";
import fragsource from "./frag.glsl?raw";
import vertsource from "./vert.glsl?raw";

const dpr = () => window.devicePixelRatio ?? 1;

function main(canvas: HTMLCanvasElement, btn: HTMLParagraphElement) {
  let anim: number;
  let playing = false;
  const musicD: number[] = [];
  for (let i = 0; i < 256; i++) {
    musicD[i] = 0.1;
  }
  let songP = window.location.search.substr(1);
  if (songP === "" || songP === null || songP === undefined) songP = "PR";

  const mouse = {
    x: 0.5,
    y: 0.5,
  };
  const triangleVertices = [
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

    1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ];

  canvas.width = window.innerWidth * dpr();
  canvas.height = window.innerHeight * dpr();
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
  const pmus = gl.getUniformLocation(program, "mus");
  const pmouse = gl.getUniformLocation(program, "mouse");
  const pposition = gl.getAttribLocation(program, "vertPosition");

  function update(analyser: AnalyserNode) {
    const freqArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqArray);

    for (let i = 0; i < 256; i++) {
      musicD[i] = freqArray[i];
    }

    render();
  }

  fetch("/sounds/" + songP + ".mp3")
    .then(async (x) => x.arrayBuffer())
    .then((res) => {
      const audioContext = new window.AudioContext();
      audioContext.decodeAudioData(res, (buffer) => {
        const analyser = audioContext.createAnalyser();
        const sourceNode = audioContext.createBufferSource();
        analyser.smoothingTimeConstant = 0.6;
        analyser.fftSize = 512;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        sourceNode.buffer = buffer;
        analyser.connect(audioContext.destination);
        sourceNode.connect(analyser);
        sourceNode.start(0);
        createAnimationFrame(update.bind(null, analyser));

        render();

        playing = true;

        btn.textContent = "⏸";

        btn.onclick = () => {
          sourceNode[`${playing ? "dis" : ""}connect`](analyser);
          btn.textContent = playing ? "▶️" : "⏸";
          playing ? window.cancelAnimationFrame(anim) : update(analyser);
          playing = !playing;
        };
      });
    });

  let time = 0;

  function render() {
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangleVertices), gl.STATIC_DRAW);
    gl.useProgram(program);

    gl.uniform1f(ptime, time / 50);
    gl.uniform2f(presolution, canvas.width, canvas.height);
    gl.uniform2f(pmouse, mouse.x, 1 - mouse.y);
    gl.uniform1fv(pmus, musicD);
    gl.enableVertexAttribArray(pposition);
    gl.vertexAttribPointer(pposition, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, triangleVertices.length / 2);
    time++;
  }

  window.onmousemove = (e) => {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
  };
  window.onresize = () => {
    gl.viewport(0, 0, window.innerWidth * dpr(), window.innerHeight * dpr());
    canvas.width = window.innerWidth * dpr();
    canvas.height = window.innerHeight * dpr();
  };
}
export const PixelRush = () => {
  let c: HTMLCanvasElement;
  let btn: HTMLParagraphElement;
  onMount(() => {
    main(c, btn);
  });
  return (
    <>
      <canvas ref={c!} style={{ width: "100%", height: "100%" }} />
      <div class="pick-song">
        Song:
        <br />
        <a href="/?PR">Pixel Rush</a>
        <br />
        <a href="/?SW">Star Wars</a>
        <br />
        <a href="/?FM">Finn McMissile</a>
      </div>
      <p class="btn" ref={btn!}>
        Loading...
      </p>
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = ``;
export const PixelRushExperiment: Experiment = { title: "Pixel Rush", component: PixelRush, imgUrl, description };
