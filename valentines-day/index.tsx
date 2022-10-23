import chroma from "chroma-js";
import { onMount } from "solid-js";
import { MAGENTA_MUL, BASE_DARK } from "../shared/constants/colors";
import { createAnimationFrame } from "../utils";

function main(c: HTMLCanvasElement, textField: HTMLTextAreaElement) {
  const ctx = c.getContext("2d")!;
  let hsize = 5;
  const n = 1000;
  let speed = 1;
  const size = {
    x: document.body.clientWidth,
    y: window.innerHeight,
  };

  class Particle {
    a: number;
    b: number;
    c: number;
    d: number;
    f: number;
    fillColor: string;
    j: number;
    x: number;
    speed: number;
    y: number;
    strokeColor: string;
    constructor(i: number) {
      const g = (i / 4) % size.x;
      const t = Math.floor(i / 4 / size.x);
      this.x = random(1) * speed;
      this.y = random(1) * speed;
      this.j = g;
      this.speed = t;
      this.a = random() * hsize;
      this.b = random() * hsize;
      this.f = 2 + random(0) * hsize; //put a 1 inside random for upside down hearts
      this.d = 0.05;
      this.fillColor = chroma
        .blend(chroma(MAGENTA_MUL).brighten(true ? -1 : 1), BASE_DARK, true ? "screen" : "multiply")
        .hex();
      this.strokeColor = chroma
        .blend(chroma(MAGENTA_MUL), BASE_DARK, true ? "screen" : "multiply")
        .hex();
      this.c = hsize + random(1) * hsize;
    }
    heart() {
      const he = this.f;
      const wi = this.f;
      const x = this.x;
      const y = this.y;
      ctx.fillStyle = this.fillColor;
      ctx.lineWidth = 2;
      ctx.strokeStyle = this.strokeColor;
      ctx.beginPath();
      ctx.moveTo(x + 0.5 * wi, y + 0.3 * he);
      ctx.bezierCurveTo(x + 0.1 * wi, y, x, y + 0.6 * he, x + 0.5 * wi, y + 0.9 * he);
      ctx.bezierCurveTo(x + 1 * wi, y + 0.6 * he, x + 0.9 * wi, y, x + 0.5 * wi, y + 0.3 * he);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }

    h() {
      const x = this.x;
      const y = this.y;
      const b = this.c;
      const l = this.j;
      const hsize = this.speed;
      x < l - this.c && ((this.x = l - b), (this.a *= -1));
      x > l + this.c && ((this.x = l + b), (this.a *= -1));
      y < hsize - b && ((this.y = hsize - b), (this.b *= -1));
      y > hsize + b && ((this.y = hsize + b), (this.b *= -1));
    }
    i() {
      this.a > n && (this.a = n);
      this.b > n && (this.b = n);
      this.x += this.a * this.d;
      this.y += this.b * this.d;
      this.h();
    }
  }

  function background() {
    ctx.fillStyle = BASE_DARK;
    ctx.fillRect(0, 0, size.x, size.y);
  }

  function random(neg?: number) {
    const rand = Math.random();
    return neg ? 2 * rand - 1 : rand;
  }

  let s = 0;
  let particles: Particle[] = [];

  textField.innerHTML = "happy";
  setText("happy");

  function setText(t: string) {
    speed = 1;
    particles = [];
    clearInterval(s);

    background();

    ctx.fillStyle = "black";
    const fontt = "'Hachi Maru Pop'";
    ctx.font = 100 + "px " + fontt;
    let measure = ctx.measureText(t);
    let bbox = {
      x: measure.actualBoundingBoxLeft,
      y: -measure.actualBoundingBoxAscent,
      w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
      h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
    };
    const heightOfFont = Math.floor(Math.min((c.width - 200) / (bbox.w / 100), (c.height - 200) / (bbox.h / 100)));

    hsize = Math.min(Math.floor(heightOfFont / 20) + 1, Math.floor(Math.min(size.x, size.y) / 20) + 1);

    ctx.font = heightOfFont + "px " + fontt;
    measure = ctx.measureText(t);
    bbox = {
      x: measure.actualBoundingBoxLeft,
      y: -measure.actualBoundingBoxAscent,
      w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
      h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
    };

    ctx.fillText(
      t,
      (size.x + bbox.w) / 2 - measure.actualBoundingBoxRight + measure.actualBoundingBoxLeft,
      size.y / 2 - bbox.y - bbox.h / 2
    );

    const ctext = ctx.getImageData(0, 0, size.x, size.y);
    const pixtext = ctext.data;

    for (let i = 0; i < pixtext.length; i += 4) {
      if (0 === pixtext[i] && (s++, 0 === s % hsize)) {
        const p = new Particle(i);
        p.heart();
        particles.push(p);
      }
    }
  }

  createAnimationFrame(() => {
    background();
    for (const particle of particles) {
      particle.i();
      particle.heart();
    }
  });

  return setText;
}

export const ValentinesDay = () => {
  let c: HTMLCanvasElement;
  let field: HTMLTextAreaElement;
  let fn: (t: string) => void;
  onMount(() => {
    fn = main(c, field);
  });
  return (
    <>
      <canvas ref={c!} width={window.innerWidth} height={window.innerHeight} />
      <div class="well">
        <textarea
          ref={field!}
          onkeyup={(e) => {
            fn(e.currentTarget.value);
          }}
        />
      </div>
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = ``;
export const ValentinesDayExperiment: Experiment = { title: "Valentines Day", component: ValentinesDay, imgUrl, description };
