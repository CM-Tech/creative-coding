import * as dat from "dat.gui";
import chroma from "chroma-js";
import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";
interface MouseData {
  x: number;
  y: number;
  down: boolean;
}
const mouse: MouseData = { x: 0, y: 0, down: false };

function main(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  canvas.addEventListener("mousedown", () => {
    mouse.down = true;
  });
  const WW = 1024;
  let w = window.innerWidth;
  let h = window.innerHeight;
  let cw = window.innerWidth * (window.devicePixelRatio ?? 1);
  let ch = window.innerHeight * (window.devicePixelRatio ?? 1);
  let simScale = Math.min(WW / cw, WW / ch);
  w = simScale * cw;
  h = simScale * ch;
  canvas.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX * simScale * (window.devicePixelRatio ?? 1);
    mouse.y = event.clientY * simScale * (window.devicePixelRatio ?? 1);
  });
  const resize = () => {
    cw = window.innerWidth * (window.devicePixelRatio ?? 1);
    ch = window.innerHeight * (window.devicePixelRatio ?? 1);
    simScale = Math.min(WW / cw, WW / ch);
    w = simScale * cw;
    h = simScale * ch;
    canvas.width = cw;
    canvas.height = ch;
  };
  window.addEventListener("resize", resize);
  class SPHConfig {
    GRAVITY_X: number;
    GRAVITY_Y: number;
    RANGE: number;
    PRESSURE: number;
    VISCOSITY: number;
    DARK: boolean;
    ARC = false;
    constructor() {
      this.GRAVITY_Y = 0.125;
      this.GRAVITY_X = 0;
      this.RANGE = 32;
      this.PRESSURE = 1;
      this.VISCOSITY = 0.05;
      this.DARK = true;
    }
  }
  const SPH = new SPHConfig();

  const gui = new dat.GUI();
  gui.add(SPH, "DARK").name("dark mode");
  gui.add(SPH, "ARC").name("circles");
  gui.add(SPH, "VISCOSITY").name("viscosity").max(0.5).min(0).step(0.025);
  gui.add(SPH, "GRAVITY_X").name("gravity x").max(1).min(-1).step(0.125);
  gui.add(SPH, "GRAVITY_Y").name("gravity y").max(1).min(-1).step(0.125);
  resize();
  const RANGE2 = SPH.RANGE * SPH.RANGE;
  const DENSITY = 0.1;
  const NUM_GRIDSX = Math.ceil(WW / SPH.RANGE);
  const NUM_GRIDSY = Math.ceil(WW / SPH.RANGE);
  let INV_GRID_SIZEX = 1 / (w / NUM_GRIDSX);
  let INV_GRID_SIZEY = 1 / (h / NUM_GRIDSY);
  const particles: Particle[] = [];
  let numParticles = 0;
  const neighbors: Neighbor[] = [];
  let numNeighbors = 0;
  let count = 0;
  const grids: Grid[][] = [];
  let delta = 0;
  let lastTick = new Date();

  function tick() {
    const tick = new Date();
    delta += Math.min((+tick - +lastTick) / 60, 2);
    lastTick = tick;
  }

  function frame() {
    const tempDelta = delta + 0;
    delta = 0;

    if (mouse.down) pour();

    move(tempDelta);
    ctx.font = "30px Arial";
  }

  createAnimationFrame(() => {
    frame();
    tick();
    calc();

    ctx.resetTransform();

    ctx.scale(1 / simScale, 1 / simScale);
    ctx.fillStyle = "#EBE8E7";

    ctx.fillStyle = "#312D32";
    const BK = SPH.DARK ? "#312D32" : "#EBE8E7";
    ctx.fillStyle = BK;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "blue";
    ctx.strokeStyle = "blue";
    ctx.fillStyle = "#3ED9D8";

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = chroma.blend(chroma("#55EEEE"), BK, SPH.DARK ? "screen" : "multiply").hex(); //chroma.hsl(hsl[0]+p.color*360,hsl[1],hsl[2]);

    for (let i = 0; i < numParticles; i++) {
      const p = particles[i];

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.rx, -p.ry));
      const ry = Math.max(SPH.RANGE / 2 - (p.min_dc < 1 ? SPH.RANGE / 2 : p.min_d / p.min_dc / 2), 0) / 2;
      const rx = ry;
      if (SPH.ARC) {
        ctx.beginPath();
        ctx.arc(0, 0, rx + 2, 0, 2 * Math.PI, false);
        ctx.fill();
      } else {
        ctx.fillRect(0 - (rx + 2), 0 - (ry + 2), (rx + 2) * 2, (ry + 2) * 2);
      }
      ctx.restore();
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = chroma
      .blend(chroma("#55EEEE").brighten(SPH.DARK ? -1 : 1), BK, SPH.DARK ? "screen" : "multiply")
      .hex();

    for (let i = 0; i < numParticles; i++) {
      const p = particles[i];
      //   ctx.beginPath();
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(Math.atan2(p.rx, -p.ry));
      const ry = Math.max(0, SPH.RANGE / 2 - (p.min_dc < 1 ? SPH.RANGE / 2 : p.min_d / p.min_dc / 2)) / 2;
      const rx = ry;

      if (SPH.ARC) {
        ctx.beginPath();
        ctx.arc(0, 0, rx, 0, 2 * Math.PI, false);
        ctx.fill();
      } else {
        ctx.fillRect(0 - rx, 0 - ry, rx * 2, ry * 2);
      }
      ctx.restore();
    }

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, SPH.RANGE / Math.sqrt(2));

    // Add three color stops
    gradient.addColorStop(0, `hsla(180, ${67 + 0 * (50 - 67)}%, ${55 + 0 * (82 - 55)}%,100%)`);
    gradient.addColorStop(1, `hsla(180, ${67 + 0 * (50 - 67)}%, ${55 + 0 * (82 - 55)}%,0%)`);
    ctx.fillStyle = gradient;

    ctx.globalAlpha = 1;

    ctx.filter = "none";
    ctx.globalCompositeOperation = "source-over";
  });

  function pour() {
    if (count % 1 == 0) {
      const p = new Particle(mouse.x + (Math.random() - 0.5) * SPH.RANGE, mouse.y + (Math.random() - 0.5) * SPH.RANGE);

      particles[numParticles++] = p;
    }
  }

  function calc() {
    updateGrids();
    findNeighbors();
    calcPressure();
    calcForce();

    window.setTimeout(calc, 1000 / 60);
  }

  function move(steps: number) {
    count++;
    for (let i = 0; i < numParticles; i++) {
      const p = particles[i];
      for (let j = 0; j < steps; j++) {
        p.move();
      }
    }
  }

  function updateGrids() {
    INV_GRID_SIZEX = 1 / (w / NUM_GRIDSX);
    INV_GRID_SIZEY = 1 / (h / NUM_GRIDSY);
    let i;
    let j;
    for (i = 0; i < NUM_GRIDSX; i++) for (j = 0; j < NUM_GRIDSY; j++) grids[i][j].clear();
    for (i = 0; i < numParticles; i++) {
      const p = particles[i];
      p.min_d = SPH.RANGE;
      p.min_dc = 1;
      p.fx = p.fy = p.density = 0;
      p.gx = Math.floor(p.x * INV_GRID_SIZEX);
      p.gy = Math.floor(p.y * INV_GRID_SIZEY);
      if (p.gx < 0) p.gx = 0;
      if (p.gy < 0) p.gy = 0;
      if (p.gx > NUM_GRIDSX - 1) p.gx = NUM_GRIDSX - 1;
      if (p.gy > NUM_GRIDSY - 1) p.gy = NUM_GRIDSY - 1;
      grids[p.gx][p.gy].add(p);
    }
  }

  function findNeighbors() {
    numNeighbors = 0;
    const sX = Math.ceil(SPH.RANGE / (w / NUM_GRIDSX));
    const sY = Math.ceil(SPH.RANGE / (h / NUM_GRIDSY));
    for (let i = 0; i < numParticles; i++) {
      const p = particles[i];
      for (let dx = -sX; dx <= sX; dx += 1) {
        if (dx + p.gx >= 0 && dx + p.gx < NUM_GRIDSX) {
          for (let dy = -sY; dy <= sY; dy += 1) {
            if (dy + p.gy >= 0 && dy + p.gy < NUM_GRIDSY) {
              findNeighborsInGrid(p, grids[p.gx + dx][p.gy + dy]);
            }
          }
        }
      }
    }
  }

  function findNeighborsInGrid(pi: Particle, g: Grid) {
    for (let j = 0; j < g.numParticles; j++) {
      const pj = g.particles[j];
      if (pi == pj) continue;
      const distance = (pi.x - pj.x) * (pi.x - pj.x) + (pi.y - pj.y) * (pi.y - pj.y);
      if (distance < RANGE2) {
        if (neighbors.length == numNeighbors) neighbors[numNeighbors] = new Neighbor();
        neighbors[numNeighbors++].setParticle(pi, pj);
      }
    }
  }

  function calcPressure() {
    for (let i = 0; i < numParticles; i++) {
      const p = particles[i];
      if (p.density < DENSITY) p.density = DENSITY;
      p.pressure = p.density - DENSITY;
    }
  }

  function calcForce() {
    for (let i = 0; i < numNeighbors; i++) {
      const n = neighbors[i];
      n.calcForce();
    }
    for (let i = 0; i < numParticles; i++) {
      particles[i].calcForce();
    }
  }

  class Particle {
    x: number;
    y: number;
    color: number;
    density: number;
    vy: number;
    fx: number;
    fy: number;
    gx: number;
    gy: number;
    rx: number;
    ry: number;
    pressure: number;
    vx: number;
    min_d: number;
    min_dc: number;
    constructor(x: number, y: number) {
      this.min_d = SPH.RANGE;
      this.min_dc = 1;
      this.x = x;
      this.y = y;
      this.gx = 0;
      this.gy = 0;
      this.vx = 0;
      this.vy = 0;
      this.fx = 0;
      this.fy = 0;
      this.rx = 0;
      this.ry = 0;
      this.density = 0;
      this.pressure = 0;
      this.color = Math.random();
    }
    move() {
      this.rx = this.rx * 0.9 + 0.1 * this.fx * Math.sign(this.fy);
      this.ry = this.ry * 0.9 + 0.1 * this.fy * Math.sign(this.fy);
      this.vy += SPH.GRAVITY_Y + (Math.random() - 0.5) * 0.0001;
      this.vx += SPH.GRAVITY_X + (Math.random() - 0.5) * 0.0001;
      this.vx += this.fx;
      this.vy += this.fy;
      this.x += this.vx;
      this.y += this.vy;
      this.color = 0; //(Math.sin(Math.hypot(this.rx,this.ry)*5)*0.5+1.5)%1;
    }

    calcForce() {
      const B = SPH.RANGE;

      if (this.x < B) this.fx += (B - this.x) * 0.125 - this.vx * 0.5;
      if (this.y < B) this.fy += (B - this.y) * 0.125 - this.vy * 0.5;
      if (this.x > w - B) this.fx += (w - B - this.x) * 0.125 - this.vx * 0.5;
      if (this.y > h - B) this.fy += (h - B - this.y) * 0.125 - this.vy * 0.5;
    }
  }
  class Neighbor {
    p1?: Particle;
    p2?: Particle;
    distance: number;
    nx: number;
    ny: number;
    weight: number;
    constructor() {
      this.distance = 0;
      this.nx = 0;
      this.ny = 0;
      this.weight = 0;
    }

    setParticle(p1: Particle, p2: Particle) {
      this.p1 = p1;
      this.p2 = p2;
      this.nx = p1.x - p2.x + (Math.random() - 0.5) * 0.005;
      this.ny = p1.y - p2.y + (Math.random() - 0.5) * 0.005;
      this.distance = Math.sqrt(this.nx * this.nx + this.ny * this.ny);
      this.weight = 1 - Math.max(this.distance, 1) / SPH.RANGE;
      let temp = this.weight * this.weight * this.weight;
      p1.density += temp;
      p2.density += temp;
      temp = 1 / Math.max(this.distance, 1);
      this.nx *= temp;
      this.ny *= temp;
    }

    calcForce() {
      if (!this.p1 || !this.p2) {
        return;
      }
      const { p1, p2 } = this;
      const pressureWeight = ((this.weight * (p1.pressure + p2.pressure)) / (p1.density + p2.density)) * SPH.PRESSURE;
      const viscosityWeight = (this.weight / (p1.density + p2.density)) * SPH.VISCOSITY;

      p1.fx += this.nx * pressureWeight;
      p1.fy += this.ny * pressureWeight;
      p2.fx -= this.nx * pressureWeight;
      p2.fy -= this.ny * pressureWeight;
      const rvx = p2.vx - p1.vx;
      const rvy = p2.vy - p1.vy;
      p1.fx += rvx * viscosityWeight;
      p1.fy += rvy * viscosityWeight;
      p2.fx -= rvx * viscosityWeight;
      p2.fy -= rvy * viscosityWeight;
      p1.min_d = Math.min(p1.min_d, this.distance);

      p1.min_dc = 1;

      p2.min_d = Math.min(p2.min_d, this.distance);
      p2.min_dc = 1;
    }
  }
  class Grid {
    particles: Particle[];
    numParticles: number;
    constructor() {
      this.particles = [];
      this.numParticles = 0;
    }
    clear() {
      this.numParticles = 0;
      this.particles = [];
    }
    add(p: Particle) {
      this.particles[this.numParticles++] = p;
    }
  }

  for (let i = 0; i < NUM_GRIDSX; i++) {
    grids[i] = new Array(NUM_GRIDSY);
    for (let j = 0; j < NUM_GRIDSY; j++) grids[i][j] = new Grid();
  }
  canvas.addEventListener(
    "mouseup",
    () => {
      mouse.down = false;
    },
    false
  );
}
export const SPHWater = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return <canvas ref={c!} style={{ width: "100%", height: "100%" }} />;
};
