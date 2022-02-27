import { onMount } from "solid-js";
import fragsource from "./frag.glsl?raw";
import vertsource from "./vert.glsl?raw";

function main(canvas: HTMLCanvasElement, btn: HTMLParagraphElement) {
  let anim: number;
  let playing = false;
  let musicD: number[] = [];
  for (let i = 0; i < 256; i++) {
    musicD[i] = 0.1;
  }
  let songP = window.location.search.substr(1);
  if (songP === "" || songP === null || songP === undefined) songP = "PR";

  let mouse = {
    x: 0.5,
    y: 0.5,
  };
  let triangleVertices = [
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

    1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ];

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
  let pmus = gl.getUniformLocation(program, "mus");
  let pmouse = gl.getUniformLocation(program, "mouse");
  let pposition = gl.getAttribLocation(program, "vertPosition");

  function update(analyser: AnalyserNode) {
    let freqArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteFrequencyData(freqArray);

    for (let i = 0; i < 256; i++) {
      musicD[i] = freqArray[i];
    }

    render();
    anim = window.requestAnimationFrame(update.bind(null, analyser));
  }

  fetch("/sounds/" + songP + ".mp3")
    .then((x) => x.arrayBuffer())
    .then((res) => {
      let audioContext = new window.AudioContext();
      audioContext.decodeAudioData(res, (buffer) => {
        let analyser = audioContext.createAnalyser();
        let sourceNode = audioContext.createBufferSource();
        analyser.smoothingTimeConstant = 0.6;
        analyser.fftSize = 512;
        analyser.minDecibels = -90;
        analyser.maxDecibels = -10;
        sourceNode.buffer = buffer;
        analyser.connect(audioContext.destination);
        sourceNode.connect(analyser);
        sourceNode.start(0);
        update(analyser);

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
    gl.uniform2f(presolution, window.innerWidth, window.innerHeight);
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
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
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
      <canvas ref={c!} />
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
