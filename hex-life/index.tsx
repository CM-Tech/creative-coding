import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";
import fragsource from "./frag.glsl?raw";
import vertsource from "./vert.glsl?raw";

const mouse = {
  x: 0.5,
  y: 0.5,
};
let hexR = 20;
let white = false;
function twhite() {
  white = !white;
}

const draw = (canvas: HTMLCanvasElement, slider: HTMLInputElement) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })!;
  const vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fragmentShader, fragsource);
  gl.shaderSource(vertexShader, vertsource);
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);
  const program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  const triangleVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
  let t1 = createTarget(window.innerWidth, window.innerHeight);
  let t2 = createTarget(window.innerWidth, window.innerHeight);
  const resolution = gl.getUniformLocation(program, "resolution");
  const fTick = gl.getUniformLocation(program, "fTick");
  const lastFTick = gl.getUniformLocation(program, "lastFTick");
  const ptime = gl.getUniformLocation(program, "time");
  const pmouse = gl.getUniformLocation(program, "mouse");
  const msize = gl.getUniformLocation(program, "msize");
  const pwhite = gl.getUniformLocation(program, "white");
  const phexR = gl.getUniformLocation(program, "hexR");
  const backbuffer = gl.getUniformLocation(program, "backbuffer");
  const position = gl.getAttribLocation(program, "vertPosition");
  let tick=0;
  function render(time: number) {
    tick+=1;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t2.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t1.framebuffer);
    gl.uniform1f(ptime, time / 1000);
    gl.uniform1f(fTick, tick/4);
    gl.uniform1f(lastFTick, (tick-1)/4);
    gl.uniform1f(pwhite, +white);
    gl.uniform1f(msize, +slider.value * 20);
    gl.uniform1f(phexR, hexR);
    gl.uniform2f(resolution, window.innerWidth, window.innerHeight);
    gl.uniform2f(pmouse, mouse.x, 1 - mouse.y);
    gl.uniform1i(backbuffer, 0);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, t1.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniform1i(backbuffer, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    [t1, t2] = [t2, t1];
  }
  createAnimationFrame(render);

  window.onmousemove = (e) => {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
  };
  window.onresize = () => {
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    t1 = createTarget(window.innerWidth, window.innerHeight);
    t2 = createTarget(window.innerWidth, window.innerHeight);
  };
  window.onwheel = (e: WheelEvent) => {
    e.preventDefault();
    let delta = -e.deltaY;
    e.preventDefault();

    delta = Math.max(-1, Math.min(1, delta));
    if ((hexR < 20 && delta < 0) || (hexR > 1 && delta > 0)) hexR -= delta;
  };
  function createTarget(width: number, height: number) {
    const target = {
      framebuffer: gl.createFramebuffer(),
      renderbuffer: gl.createRenderbuffer(),
      texture: gl.createTexture(),
    };
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    gl.bindRenderbuffer(gl.RENDERBUFFER, target.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.renderbuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return target;
  }
};

export const HexLife = () => {
  let c: HTMLCanvasElement;
  let slider: HTMLInputElement;
  onMount(() => {
    draw(c, slider);
  });
  return (
    <>
      <div class="well">
        <button
          onclick={() => {
            document.body.classList.toggle("white");
            twhite();
          }}
        >
          Toggle Theme
        </button>
        <input type="range" max="10" min="2" value="5" style="width: 400px" ref={slider!} />
      </div>
      <canvas ref={c!} />
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = ``;
export const HexLifeExperiment: Experiment = { title: "Hex Life", component: HexLife, imgUrl, description };
