import { createAnimationFrame } from "../utils";

const input = document.getElementById("tex") as HTMLInputElement;
const c = document.getElementById("c") as HTMLCanvasElement;
const ctx = c.getContext("2d")!;
const size = {
  w: window.innerWidth,
  h: window.innerHeight,
};
const balls: ball[] = [];
let rays: line[] = [];
let ballRays: line[] = [];

class line {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  constructor(x: number, y: number, x2: number, y2: number) {
    this.x1 = x;
    this.y1 = y;
    this.x2 = x2;
    this.y2 = y2;
  }
}
class ball {
  x: number;
  y: number;
  vx = 0;
  vy = 0;
  fx = 0;
  fy = 0;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  move() {
    this.x += this.fx;
    this.y += this.fy;
    this.vy += 0.5;
    if (this.y + 20 > size.h) {
      this.y = size.h - 20;
      this.vy = -Math.abs(this.vy) * 0.5;
    }
    if (this.x + 20 > size.w) {
      this.x = size.w - 20;
      this.vx = -Math.abs(this.vx) * 0.5;
    }
    if (this.x - 20 < 0) {
      this.x = 20;
      this.vx = Math.abs(this.vx) * 0.5;
    }
    this.x += this.vx;
    this.y += this.vy;
    this.vx = this.vx * 0.95;
    this.vy = this.vy * 0.95;
    this.fx = 0;
    this.fy = 0;
  }
}

let pixels: boolean[][] = [];
let ballPixels: boolean[][] = [];
let edgePoints: { x: number; y: number }[] = [];
let ballPoints: { x: number; y: number }[] = [];
c.width = size.w;
c.height = size.h;
for (let i = 0; i < 10; i++) balls.push(new ball(Math.random() * size.w, Math.random() * size.h));
input.value = "Cobwebify is Amazing";
const raylength = 20; //distance before ray is destroyed
const cpp = 3; //amount of times a pixel should send a ray
function fragmentText(text: string, maxWidth: number) {
  const words = text.split(" ");
  const lines = [];
  let line = "";
  if (ctx.measureText(text).width < maxWidth) return [text];
  while (words.length > 0) {
    while (ctx.measureText(words[0]).width >= maxWidth) {
      const tmp = words[0];
      words[0] = tmp.slice(0, -1);
      if (words.length > 1) words[1] = tmp.slice(-1) + words[1];
      else words.push(tmp.slice(-1));
    }
    if (ctx.measureText(line + words[0]).width < maxWidth) line += words.shift() + " ";
    else {
      lines.push(line);
      line = "";
    }
    if (words.length === 0) lines.push(line);
  }
  return lines;
}
function raycast(x: number, y: number) {
  let dirX = Math.random();
  dirX < 0.5 && (dirX = -dirX);
  const dirY = Math.random() * 2 - 1;
  let cX = x;
  let cY = y;
  for (let i = 0; i < raylength; i++) {
    cX += dirX;
    cY += dirY;
    if (
      Math.floor(cY) > 0 &&
      Math.floor(cY) < pixels.length &&
      Math.floor(cX) > 0 &&
      Math.floor(cX) < pixels[0].length
    ) {
      if (pixels[Math.floor(cY)][Math.floor(cX)]) {
        drawLine(x, y, cX, cY, rays);
        return true; //indicates hit
      }
    }
  }
  return false;
}
function raycastBall(x: number, y: number) {
  let dirX = Math.random();
  dirX < 0.5 && (dirX = -dirX);
  const dirY = Math.random() * 2 - 1;
  let cX = x;
  let cY = y;
  for (let i = 0; i < raylength; i++) {
    cX += dirX;
    cY += dirY;
    if (
      Math.floor(cY) > 0 &&
      Math.floor(cY) < pixels.length &&
      Math.floor(cX) > 0 &&
      Math.floor(cX) < pixels[0].length
    ) {
      if (pixels[Math.floor(cY)][Math.floor(cX)] || ballPixels[Math.floor(cY)][Math.floor(cX)]) {
        drawLine(x, y, cX, cY, ballRays);
        return true; //indicates hit
      }
    }
  }
  return false;
}
function setupPixels(txt: string[]) {
  ctx.clearRect(0, 0, size.w, size.h);
  ctx.beginPath();
  ctx.font = "100px Arial";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.textAlign = "center";
  txt.forEach(function (line, i) {
    ctx.strokeText(line, size.w / 2, (i + 1) * 100 + 60);
  });
  if (pixels.length === 0) {
    pixels = [];
    const ctext = ctx.getImageData(0, 0, size.w, size.h);
    const pixtext = ctext.data;
    for (let i = 0; i < pixtext.length; i += 4) {
      //make row
      if ((i / 4) % size.w === 0) {
        pixels[Math.floor(i / 4 / size.w)] = [];
      }
      // having inequality over half opacity gives
      //best result because of antialising
      if (255 / 2 < pixtext[i + 3]) {
        edgePoints.push({
          x: (i / 4) % size.w,
          y: Math.floor(i / 4 / size.w),
        });
        pixels[Math.floor(i / 4 / size.w)][(i / 4) % size.w] = true;
      } else {
        pixels[Math.floor(i / 4 / size.w)][(i / 4) % size.w] = false;
      }
    }
  }
  ctx.clearRect(0, 0, size.w, size.h);
  for (let i = 0; i < balls.length; i++) {
    ctx.beginPath();
    ctx.arc(balls[i].x, balls[i].y, 20, 0, Math.PI * 2, true);
    ctx.stroke();
  }
  ballPixels = [];
  ballPoints = [];
  ballRays = [];
  const cball = ctx.getImageData(0, 0, size.w, size.h);
  const pixball = cball.data;
  for (let i = 0; i < pixball.length; i += 4) {
    //make row
    if ((i / 4) % size.w === 0) {
      ballPixels[Math.floor(i / 4 / size.w)] = [];
    }
    // having inequality over half opacity gives
    //best result because of antialising
    if (255 / 2 < pixball[i + 3]) {
      ballPoints.push({
        x: (i / 4) % size.w,
        y: Math.floor(i / 4 / size.w),
      });
      ballPixels[Math.floor(i / 4 / size.w)][(i / 4) % size.w] = true;
    } else {
      ballPixels[Math.floor(i / 4 / size.w)][(i / 4) % size.w] = false;
    }
  }
  //redraw text
  ctx.beginPath();
  ctx.font = "100px Arial";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.textAlign = "center";
  txt.forEach(function (line, i) {
    ctx.strokeText(line, size.w / 2, (i + 1) * 100 + 60);
  });
}
function tick() {
  //collide
  for (let i = 0; i < balls.length; i++) {
    for (let j = i + 1; j < balls.length; j++) {
      const dx = balls[j].x - balls[i].x;
      const dy = balls[j].y - balls[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 40) {
        const force = 0.5 / (dist / 20);
        balls[j].fx += dx * force;
        balls[i].fx += -dx * force;
        balls[j].fy += dy * force;
        balls[i].fy += -dy * force;
      }
    }
  }
  //move
  for (let i = 0; i < balls.length; i++) balls[i].move();
  key();
}
createAnimationFrame(tick);
function drawLine(x: number, y: number, x1: number, y1: number, arr?: line[]) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  arr && arr.push(new line(x, y, x1, y1));
}
function setup(txt: string) {
  //create an array of pixels witht the bodrer of the text
  setupPixels(fragmentText(txt, size.w));
  if (rays.length === 0) {
    for (let i = 0; i < 0.5 * edgePoints.length; i++) {
      const edgePoint = edgePoints[Math.floor(Math.random() * edgePoints.length)];
      for (let j = 0; j < cpp; j++) raycast(edgePoint.x, edgePoint.y);
    }
  } else {
    for (let i = 0; i < ballPoints.length * cpp; i++) {
      const ballPoint = ballPoints[i % (ballPoints.length - 1)];
      raycastBall(ballPoint.x, ballPoint.y);
    }
    for (let i = 0; i < ballRays.length; i++) {
      const ray = ballRays[i];
      drawLine(ray.x1, ray.y1, ray.x2, ray.y2);
    }
    for (let i = 0; i < rays.length; i++) {
      const ray = rays[i];
      drawLine(ray.x1, ray.y1, ray.x2, ray.y2);
    }
  }
}
setup(input.value);
function key() {
  pixels = [];
  edgePoints = [];
  ctx.clearRect(0, 0, size.w, size.h);
  setup(input.value);
}
function change() {
  rays = [];
  key();
}
input.onkeyup = change;
input.onchange = change;
window.onresize = function () {
  size.w = window.innerWidth;
  size.h = window.innerHeight;
  c.width = size.w;
  c.height = size.h;
  change();
};
