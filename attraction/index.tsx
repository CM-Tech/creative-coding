import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

const w = window.innerWidth;
const h = window.innerHeight;
let ctx: CanvasRenderingContext2D;
let mouseX = 0;
let mouseY = 0;
const particles: Particle[] = [];
let n = 0;
const mass = 5;
const friction = 0.05;
const speed = 0.04;

function getCoords(event: MouseEvent) {
  mouseX = event.clientX;
  mouseY = event.clientY;
}

class Particle {
  x: number;
  y: number;
  dx = 0;
  dy = 0;
  lx = 0;
  ly = 0;
  color: number;
  constructor(x_: number, y_: number) {
    this.x = x_;
    this.y = y_;
    this.color = Math.random() * 360;
  }
  updateLastPos(delta: number) {
    this.lx = this.x;
    this.ly = this.y;
    for (let j = 0; j < n; j++) {
      const part = particles[j];
      const _x1 = part.x - this.x;
      const _y1 = part.y - this.y;
      const _d = mass / Math.max(_x1 * _x1 + _y1 * _y1, 25);
      this.dx += _x1 * _d * delta;
      this.dy += _y1 * _d * delta;
      this.x += this.dx * speed * delta;
      this.y += this.dy * speed * delta;
    }
    const _x1 = mouseX - this.x;
    const _y1 = mouseY - this.y;
    const _d = 100 / Math.max(_x1 * _x1 + _y1 * _y1, 25);
    this.dx += _x1 * _d * delta;
    this.dy += _y1 * _d * delta;

    this.x += this.dx * speed * delta;
    this.y += this.dy * speed * delta;
    if (this.x < 10) {
      this.dx = Math.abs(this.dx);
    }
    if (this.x > w - 10) {
      this.dx = -Math.abs(this.dx);
    }
    if (this.y < 10) {
      this.dy = Math.abs(this.dy);
    }
    if (this.y > h - 10) {
      this.dy = -Math.abs(this.dy);
    }
    this.dy = this.dy * Math.pow(1 - friction, delta);
    this.dx = this.dx * Math.pow(1 - friction, delta);
  }
}

let lastTime = Date.now();
function tick() {
  const delta = Date.now() - lastTime;
  lastTime = Date.now();

  for (let i = 0; i < n; i++) {
    const part = particles[i];
    part.updateLastPos(delta / 8);
  }

  ctx.clearRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = "grey";
  for (let b = 0; b < 1; b++) {
    if (b == 1) {
      ctx.globalCompositeOperation = "hue";
    } else {
      ctx.globalCompositeOperation = "normal";
    }

    for (let i = 0; i < n; i++) {
      const part = particles[i];

      ctx.strokeStyle = "hsl(" + part.color + ",100%,50%)";
      ctx.lineWidth = 4;
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.beginPath();
      const deg = Math.atan2(part.lx - part.x, -part.ly + part.y);
      ctx.moveTo(part.x - Math.cos(deg + Math.PI) * 8, part.y - Math.sin(deg + Math.PI) * 8);

      ctx.moveTo(part.lx, part.ly);
      ctx.lineTo(part.x, part.y);
      ctx.stroke();
    }
  }
  ctx.globalCompositeOperation = "normal";
  ctx.strokeStyle = "white";
  for (let i = 0; i < n; i++) {
    const part = particles[i];

    ctx.strokeStyle = "hsl(" + part.color + ",100%,50%)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(part.x, part.y);

    ctx.lineTo(part.lx, part.ly);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "hue";

  ctx.strokeStyle = "white";
  for (let i = 0; i < n; i++) {
    const part = particles[i];

    ctx.strokeStyle = "hsl(" + part.color + ",100%,50%)";
    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(part.x, part.y);

    ctx.lineTo(part.lx, part.ly);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "normal";
  ctx.clearRect(0, 0, w, h);
  ctx.strokeStyle = "grey";
  for (let b = 0; b < 2; b++) {
    if (b == 1) {
      ctx.globalCompositeOperation = "hue";
    } else {
      ctx.globalCompositeOperation = "normal";
    }

    for (let i = 0; i < n; i++) {
      const part = particles[i];

      ctx.strokeStyle = "hsl(" + part.color + ",100%,50%)";
      ctx.lineWidth = 4;
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.beginPath();
      const deg = Math.atan2(part.lx - part.x, -part.ly + part.y);
      ctx.moveTo(part.x - Math.cos(deg + Math.PI) * 8, part.y - Math.sin(deg + Math.PI) * 8);

      ctx.moveTo(part.lx, part.ly);

      ctx.lineTo(part.x, part.y);
      ctx.stroke();
    }
  }

  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "white";
  for (let i = 0; i < n; i++) {
    const part = particles[i];

    ctx.lineWidth = 14;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(part.x, part.y);

    ctx.lineTo(part.lx, part.ly);
    ctx.stroke();
  }
  ctx.globalCompositeOperation = "normal";

  ctx.restore();

  ctx.globalCompositeOperation = "normal";
}

for (let k = 0; k < 40; k++) {
  particles[n] = new Particle(Math.random() * w, Math.random() * h);
  n++;
}

export const Attraction = () => {
  let c!: HTMLCanvasElement;
  onMount(() => {
    c.width = w;
    c.height = h;
    ctx = c.getContext("2d")!;
    createAnimationFrame(tick);

    window.addEventListener("mousemove", getCoords);

    window.addEventListener("keypress", (e) => {
      if (e.which == 122) {
        particles[n] = new Particle(Math.random() * 200 + w / 2 - 100, Math.random() * 200 + h / 2 - 100);
        n++;
      }
    });
  });

  return <canvas ref={c} />;
};
