import { onCleanup, onMount } from "solid-js";
import { createAnimationFrame } from "../utils";
import fragsource from "./frag.glsl?raw";
import vertsource from "./vert.glsl?raw";
import displayShader from "./display.frag?raw";
import computeShader from "./compute.frag?raw";
import reglLib from "regl";

const mouse = {
  x: 0.5,
  y: 0.5,
};
const SPD=5;
let hexR = 20;
let MaxSize = 128;
let MaxSizehexR = 2;
let white = false;
function twhite() {
  white = !white;
}

const draw = (canvas: HTMLCanvasElement, slider: HTMLInputElement) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const regl = reglLib();
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
  let tick = 0;
  function render(time: number) {
    tick += 1;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t2.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t1.framebuffer);
    gl.uniform1f(ptime, time / 1000);
    gl.uniform1f(fTick, tick / 4);
    gl.uniform1f(lastFTick, (tick - 1) / 4);
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
  // createAnimationFrame(render);

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
  const fa = regl.framebuffer({ color: regl.texture({ width: MaxSize, height: MaxSize }) });
  const fb = regl.framebuffer({ color: regl.texture({ width: MaxSize, height: MaxSize }) });

  const ta = fa;
  const tb = fb; //regl.texture(canvas.width, canvas.height);
  let ttttt = 0;
  const ff = [fa, fb];
  const tf = [ta, tb];
  interface ReglProp {
    color: [number, number, number];
    BACKGROUND_COLOR: [number, number, number];
  }
  let time = 0;
  const computeR = regl({
    frag: computeShader,

    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main() {
          uv=vec2(0.0,1.0)+(position.xy+vec2(1.0))*vec2(1.0,-1.0)/2.0;
        gl_Position = vec4(position, 0, 1);
      }`,

    attributes: {
      position: regl.buffer([
        [-1, -1],
        [3, -1],
        [-1, 3],
      ]),
    },

    uniforms: {
      backbuffer: ({ tick }) => ff[ttttt % 2],
      resolution: () => [MaxSize, MaxSize],
      time: () => time,

      fTick: () => time,
      lastFTick: () => time - 1,

      white: () => +white,
      msize: () => +slider.value * 2,
      hexR: () => MaxSizehexR,
      mouse: ({ viewportWidth, viewportHeight }) =>
        [mouse.x * window.innerWidth, (1 - mouse.y) * window.innerHeight].map(
          (x) => x / Math.max(window.innerWidth, window.innerHeight)
        ),
    },
    depth: { enable: false },
    framebuffer: ({ tick }) => ff[(ttttt + 1) % 2],
    count: 3,
  });
  const displayR = regl({
    frag: displayShader,

    vert: `
      precision mediump float;
      attribute vec2 position;
      varying vec2 uv;
      void main() {
          uv=vec2(0.0,1.0)+(position.xy+vec2(1.0))*vec2(1.0,-1.0)/2.0;
        gl_Position = vec4(position, 0, 1);
      }`,

    attributes: {
      position: regl.buffer([
        [-1, -1],
        [3, -1],
        [-1, 3],
      ]),
    },

    uniforms: {
      to: ({ tick }) => ff[ttttt % 2],
      from: ({ tick }) => ff[(ttttt + 1) % 2],
      resolution: (p) => {
        // console.log(p)
        return [p.viewportWidth, p.viewportHeight];
      },
      bbResolution: () => [MaxSize, MaxSize],
      time: () => time,

      fTick: () => tickss / SPD,
      white: () => +white,
      msize: () => +slider.value * 20,
      hexR: () => MaxSizehexR,
      mouse: () => [mouse.x, 1 - mouse.y],
      COLOR_BACKGROUND: chroma(BASE_DARK)
        .brighten(true ? -1 : 1)
        .rgb()
        .map((x) => x / 255),
    },
    depth: { enable: false },
    count: 3,
  });
  let tickss = 0;

  let can = regl.frame(({ time }) => {
    regl.clear({
      color: [0, 0, 0, 0],
      depth: 1,
    });
    if (tickss % SPD <1) {
      computeR();
      ttttt += 1;
    }
    displayR();
    tickss += 1;
  });
  onCleanup(() => {
    can.cancel();
  });
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
import chroma from "chroma-js";
import { BASE_DARK } from "../shared/constants/colors";
const description = ``;
export const HexLifeExperiment: Experiment = { title: "Hex Life", component: HexLife, imgUrl, description };
