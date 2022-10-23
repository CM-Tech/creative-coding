import webShader from "./shaders/web.frag?raw";
import reglLib from "regl";
import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

const main = (c: HTMLCanvasElement, input: HTMLTextAreaElement) => {
  const regl = reglLib();
  const ctx = c.getContext("2d")!;
  const mousePos = { x: 100, y: 100 };
  let boidBeingDragged: Boid | null = null;
  const colors: [number, number, number][] = [
    [0, 255, 255],
    [255, 255, 0],
    [225, 0, 255],

    [100, 100, 255],
    [100, 255, 100],
    [225, 100, 100],
  ];

  const s = 256 * 2;
  c.width = s;
  c.height = s;
  const K = 120;
  const boidSpeed = 10;
  const boids: Boid[] = [];

  function q(max: number) {
    return Math.random() * max;
  }
  function r(max = 255) {
    return Math.floor(q(max));
  }
  function rcolor() {
    return colors[r(colors.length)];
  }
  class Boid {
    x: number;
    y: number;
    vx: number;
    vy: number;
    fx: number;
    fy: number;
    r: number;
    fillColor: [number, number, number];
    color: [number, number, number];
    colliding: boolean;
    constructor(x: number, y: number, vx: number, vy: number) {
      this.x = x;
      this.y = y;
      this.vx = vx * boidSpeed;
      this.vy = vy * boidSpeed;
      this.fx = 0;
      this.fy = 0;
      this.r = q(10) + 15;
      this.fillColor = [255, 255, 255];
      this.color = rcolor();
      this.colliding = false;
    }
    move(tm: number) {
      this.fy += 100 * this.r * this.r;

      if (this.y < this.r) {
        const dist2 = this.y;
        const rsum = this.r;
        const forceImpart = -(dist2 - rsum) * K * (this.r * this.r);
        this.fy += (-forceImpart * (0 - this.y)) / dist2;
      }

      if (size.h - this.y < this.r) {
        const dist2 = size.h - this.y;
        const rsum = this.r;
        const forceImpart = -(dist2 - rsum) * K * (this.r * this.r);
        this.fy += (-forceImpart * (size.h - this.y)) / dist2;
      }

      if (this.x < this.r) {
        const dist2 = this.x;
        const rsum = this.r;
        const forceImpart = -(dist2 - rsum) * K * (this.r * this.r);
        this.fx += (-forceImpart * (0 - this.x)) / dist2;
      }
      if (size.w - this.x < this.r) {
        const dist2 = size.w - this.x;
        const rsum = this.r;
        const forceImpart = -(dist2 - rsum) * K * (this.r * this.r);
        this.fx += (-forceImpart * (size.w - this.x)) / dist2;
      }

      this.vy += (this.fy / this.r / this.r) * tm;
      this.vx += (this.fx / this.r / this.r) * tm;
      this.fx = 0;
      this.fy = 0;
      this.y += this.vy * tm;
      this.x += this.vx * tm;
    }
    bounce(tm: number) {
      let collidingNow = false;
      let n = true;
      for (const b of boids) {
        if (b === this) {
          n = false;
          continue;
        }
        const dist = Math.hypot(b.x - this.x, b.y - this.y);

        const rsum = b.r + this.r;
        if (dist < rsum) {
          const vm =
            ((b.x - this.x) * (-this.vx * this.r * this.r + b.vx * b.r * b.r) +
              (b.y - this.y) * (-this.vy * this.r * this.r + b.vy * b.r * b.r)) /
            dist;
          const forceImpart =
            (-(dist - rsum) * K * (this.r * this.r * b.r * b.r)) / (this.r * this.r + b.r * b.r) - 3 * vm;
          const K2 = 0;
          this.fx += (-forceImpart * (b.x - b.vx * 0 - this.x + this.vx * K2)) / dist;
          this.fy += (-forceImpart * (b.y - b.vy * 0 - this.y + this.vy * K2)) / dist;

          collidingNow = true;
          if (!this.colliding && n) {
            [this.color, b.color] = [b.color, this.color];
          }
        }
      }
      this.colliding = collidingNow;
      const l = Math.pow(0.1, tm);
      for (let x = 0; x < 3; x++) {
        this.fillColor[x] = this.fillColor[x] * l + (1 - l) * this.color[x];
      }
    }
    draw() {
      ctx.strokeStyle = "rgb(" + this.fillColor.join(",") + ")";
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }
  for (let i = 0; i < ((s * s) / 512 / 512) * 40; i++) {
    boids.push(new Boid(q(s), q(s), q(2) - 1, q(2) - 1));
  }
  const size = {
    w: window.innerWidth,
    h: window.innerHeight,
  };
  input.value = "Cobwebify is Amazing";

  window.onresize = () => {
    size.w = window.innerWidth;
    size.h = window.innerHeight;
    c.width = size.w;
    c.height = size.h;
  };
  size.w = window.innerWidth;
  size.h = window.innerHeight;
  c.width = size.w;
  c.height = size.h;

  function physics(tm: number) {
    if (boidBeingDragged !== null) {
      const firstBoid = boidBeingDragged;
      firstBoid.vx += (mousePos.x - firstBoid.x) * 10 - firstBoid.vx / 2;
      firstBoid.vy += (mousePos.y - firstBoid.y) * 10 - firstBoid.vy / 2;
    }
    for (const b of boids) {
      b.bounce(tm);
    }
    for (const b of boids) {
      b.move(tm);
    }
  }
  let t = Date.now();
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, s, s);
  const tex_canvas = regl.texture(c);
  function draw() {
    const delta = Math.min(Date.now() - t, 100);
    t = Date.now();
    for (let i = 0; i < 3; i++) physics(delta / 1500);

    ctx.fillStyle = "#00000040";

    ctx.fillRect(0, 0, size.w, size.h);

    ctx.filter = "blur(0px)";
    ctx.globalCompositeOperation = "default";
    for (const b of boids) {
      b.draw();
    }
    const txt = input.value;
    ctx.beginPath();
    ctx.font = "100px Arial";
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.textAlign = "center";
    txt.split("\n").forEach((line, i) => {
      ctx.strokeText(line, size.w / 2, (i + 1) * 100 + 60);
    });

    ctx.globalCompositeOperation = "source-over"; //default
    ctx.strokeStyle = "#eee";

    tex_canvas(c);
  }
  createAnimationFrame(draw);
  function offset(el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    return { top: rect.top + scrollTop, left: rect.left + scrollLeft };
  }
  window.addEventListener("mousemove", (event) => {
    const offsetC = offset(c);
    mousePos.x = event.clientX - offsetC.left;
    mousePos.y = event.clientY - offsetC.top;
  });
  function distance(a: { x: number; y: number }, b: { x: number; y: number }) {
    return ((a.x - b.x) ** 2 + (a.y - b.y) ** 2) ** 0.5;
  }
  window.addEventListener("mousedown", (event) => {
    const offsetC = offset(c);
    mousePos.x = event.clientX - offsetC.left;
    mousePos.y = event.clientY - offsetC.top;
    let closestBoid = null;
    let closestRadius = Infinity;
    for (const b of boids) {
      if (distance(b, mousePos) - b.r < closestRadius) {
        closestRadius = distance(b, mousePos) - b.r;
        closestBoid = b;
      }
    }
    if (closestRadius < 0) boidBeingDragged = closestBoid;
  });
  window.addEventListener("mouseup", () => {
    boidBeingDragged = null;
  });

  interface ReglProp {
    color: [number, number, number];
  }
  const drawTriangle = regl({
    frag: webShader,

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
      color: regl.prop<ReglProp, "color">("color"),
      canvas: () => tex_canvas,
      resolution: () => [size.w, size.h],
    },

    count: 3,
  });

  regl.frame(({ time }) => {
    regl.clear({
      color: [0, 0, 0, 0],
      depth: 1,
    });

    drawTriangle({
      color: [Math.cos(time * 0.001), Math.sin(time * 0.0008), Math.cos(time * 0.003), 1],
    });
  });
};

export const Cobwebify = () => {
  let c: HTMLCanvasElement;
  let tex: HTMLTextAreaElement;
  onMount(() => {
    main(c, tex);
  });
  return (
    <>
      <div class="well">
        <textarea ref={tex!} />
      </div>
      <canvas ref={c!} />
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = `TODO`;
export const CobwebifyExperiment: Experiment = { title: "Cobwebify", component: Cobwebify, imgUrl, description };
