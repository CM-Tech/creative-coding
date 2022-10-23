import { Boid } from "./Boid";
import { Vec } from "./Vec";
import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

export let w = window.innerWidth;
export let h = window.innerHeight;
let ctx: CanvasRenderingContext2D;

let boids: Boid[] = [];
let avoids: Avoid[] = [];

export class Avoid {
  pos: Vec;
  constructor(x: number, y: number) {
    this.pos = new Vec(x, y);
  }
  draw() {
    ctx.fillStyle = "rgba(244, 64, 52, 0.75)";
    ctx.strokeStyle = "#323232";
    ctx.beginPath();
    ctx.arc(this.pos.x, this.pos.y, 8, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
}

for (let i = 0; i < (window.innerWidth * window.innerHeight) / 9000; i++) {
  boids.push(new Boid(Math.random() * w, Math.random() * h));
}
for (let i = 0; i < (window.innerWidth * window.innerHeight) / 11000; i++) {
  avoids.push(new Avoid(Math.random() * w, Math.random() * h));
}

function tick() {
  ctx.clearRect(0, 0, w, h);
  ctx.beginPath();
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  ctx.fillRect(0, 0, w, h);
  for (let i = 0; i < h; i += 15) {
    ctx.strokeStyle = "#5892d8";
    ctx.beginPath();
    ctx.lineWidth = (i % 30) / 30 + 1;
    ctx.moveTo(0, i + 0.5);
    ctx.lineTo(w, i + 0.5);
    ctx.stroke();
  }

  ctx.strokeStyle = "#f0615b";
  ctx.beginPath();
  ctx.lineWidth = 1;
  ctx.moveTo(40.5, 0);
  ctx.lineTo(40.5, h);
  ctx.stroke();

  boids.map((bo) => {
    bo.update(boids, avoids);
    bo.draw(ctx);
  });
  avoids.map((av) => {
    av.draw();
  });
}

export const Boids = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    c.width = w;
    c.height = h;
    ctx = c.getContext("2d")!;
    createAnimationFrame(tick);

    window.addEventListener(
      "resize",
      () => {
        w = window.innerWidth;
        h = window.innerHeight;
        c.width = w;
        c.height = h;

        avoids = [];
        for (let i = 0; i < (window.innerWidth * window.innerHeight) / 11000; i++) {
          avoids.push(new Avoid(Math.random() * w, Math.random() * h));
        }
      },
      false
    );

    window.addEventListener(
      "mousedown",
      (e) => {
        boids.push(new Boid(e.clientX, e.clientY));
      },
      false
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.keyCode == 32) {
          boids = boids.map((bo) => {
            bo.hue = new Vec(Math.random() * Math.PI * 2 - Math.PI, Math.random() * Math.PI * 2 - Math.PI).normalize();
            return bo;
          });
        }
      },
      false
    );
  });
  return (
    <>
      <canvas
        ref={c!}
        style={{
          background: "url(http://blog.spoongraphics.co.uk/wp-content/uploads/2012/textures/19.jpg)",
        }}
      />
      <div class="center">
        BOIDS
        <p class="desc">
          Click to add a new boid. <br /> Boids avoid red circles. Press space to reset colors <br /> Built by:{" "}
          <a href="https://github.com/cm-tech/">modderme123 and coler706</a>
          <br />
          Based off: <a href="https://github.com/jackaperkins/boids">boids</a>.
        </p>
      </div>
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = `TODO`;
export const BoidsExperiment: Experiment = { title: "Boids", component: Boids, imgUrl, description };
