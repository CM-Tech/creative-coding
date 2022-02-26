import { onMount } from "solid-js";
import fragsource from "./frag.glsl?raw";
import vertsource from "./vert.glsl?raw";

function main(canvas: HTMLCanvasElement) {
  let anim: number;
  let MIN_RADIUS = 32;
  let JITTER_RANGE =
    window.innerHeight <= window.innerWidth ? window.innerHeight / 2 - MIN_RADIUS : window.innerWidth / 2 - MIN_RADIUS;
  JITTER_RANGE = JITTER_RANGE * 1.2;
  let NUM_NODES = 256; // only 1/2 of these are actually drawn

  // derived
  let points: { x: number; y: number }[] = [];
  let wdraw: number[] = [];
  let mouse = {
    x: 0.5,
    y: 0.5,
  };

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let gl = canvas.getContext("webgl")!;

  let vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;

  gl.shaderSource(vertexShader, vertsource);
  gl.shaderSource(fragmentShader, fragsource);

  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);

  let program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  let ptime = gl.getUniformLocation(program, "time");
  let presolution = gl.getUniformLocation(program, "resolution");
  let pmouse = gl.getUniformLocation(program, "mouse");
  let pposition = gl.getAttribLocation(program, "vertPosition");

  function xyFromPolar(r: number, theta: number) {
    let x = Math.round(r / 1) * 1 * Math.cos(theta);
    let y = Math.round(r / 1) * 1 * Math.sin(theta);
    points.push({
      x: (x * 2) / window.innerWidth,
      y: (y * 2) / window.innerHeight,
    });
  }

  function stamp(db: number, i: number) {
    let r = MIN_RADIUS + (db * JITTER_RANGE) / 255;
    let theta = ((i - 2) / (NUM_NODES - 2.0)) * Math.PI + Math.PI / 4.0;
    xyFromPolar(r, theta);
  }

  function stamp2(db: number, i: number) {
    let r = MIN_RADIUS + (db * JITTER_RANGE) / 255;
    let theta = Math.PI - (i / NUM_NODES) * Math.PI - Math.PI / 4.0;
    xyFromPolar(r, theta);
  }

  function update(analyser: AnalyserNode) {
    let freqArray = new Uint8Array(analyser.frequencyBinCount);
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
    anim = window.requestAnimationFrame(update.bind(null, analyser));
  }

  fetch("https://cdn.glitch.com/33316a32-724f-4318-9d21-00250ecbdafb%2Fmonsters.mp3?1524420405532")
    .then((x) => x.arrayBuffer())
    .then((res) => {
      let audioContext = new AudioContext();
      audioContext.decodeAudioData(res, (buffer) => {
        let analyser = audioContext.createAnalyser();
        let sourceNode = audioContext.createBufferSource();
        analyser.smoothingTimeConstant = 0.6;
        analyser.fftSize = NUM_NODES * 2;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        sourceNode.buffer = buffer;
        analyser.connect(audioContext.destination);
        sourceNode.connect(analyser);
        sourceNode.start(0);
        update(analyser);

        render();

        let playing = true;

        let control = document.querySelector("p")!;
        control.className = "fa fa-pause";
        control.textContent = "";

        window.onclick = () => {
          sourceNode[`${playing ? "dis" : ""}connect`](analyser);
          control.className = "fa fa-" + (playing ? "play" : "pause");
          playing ? window.cancelAnimationFrame(anim) : update(analyser);
          playing = !playing;
        };
      });
    });
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
}
export const MonsterSound = () => {
  let c: HTMLCanvasElement;

  onMount(() => {
    main(c);
  });
  return (
    <>
      <canvas style={{ background: "rgb(56, 35, 37)" }} ref={c!}></canvas>
      <p class="loading">Loading...</p>
    </>
  );
};
