import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";
function main(c: HTMLCanvasElement) {
  const ctx = c.getContext("2d")!;
  const arr = [];

  let w = document.body.clientWidth - 4;
  let h = document.body.clientHeight - 4;
  const fps = 60;
  const step = 1 / fps;
  let dt = 0;
  let now;
  let last = timestamp();
  let mouse = {
    x: 0,
    y: 0,
  };
  let pressed = false;

  c.width = w;
  c.height = h;
  const options = {
    size: 3,
    strength: 2,
    expand: 1,
    speed: 8,
    squaresize: 5,
  };

  function timestamp() {
    if (window.performance && window.performance.now) return window.performance.now();
    else return new Date().getTime();
  }
  for (let r = 0; r < w - 1; r++) {
    arr[r] = [] as number[][];
    for (let c = 0; c < h - 1; c++) {
      arr[r][c] = [];
    }
  }
  const nodes: node[] = [];

  class node {
    x: number;
    y: number;
    color: string;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;
      this.color = "hsla(20,100%,50%,0.5)";
    }
  }

  function tick() {
    if (pressed) {
      for (let i = 0; i < options.strength; i++) {
        for (let y = -1; y <= options.size * options.expand; y += options.expand) {
          for (let x = -1; x <= options.size * options.expand; x += options.expand) {
            nodes.push(
              new node(
                Math.max(Math.min(w - 1, Math.floor(mouse.x + x - (options.size * options.expand) / 2)), 0),
                Math.max(Math.min(h - 1, Math.floor(mouse.y + y - (options.size * options.expand) / 2)), 0)
              )
            );
          }
        }
      }
    }

    for (let i = 0; i < nodes.length; i++) {
      const nod = nodes[i];
      const r = nod.y;
      const c = nod.x;
      if (Math.floor(Math.random() * 200) == 5) {
        if (nodes[i].color == "hsla(20,100%,50%,0.5)") {
          nodes[i].color = "hsla(0,100%,50%,0.2)";
        }
      }
      if (Math.floor(Math.random() * 400) == 5) {
        if (nodes[i].color == "hsla(0,100%,50%,0.2)") {
          nodes[i].color = "hsla(20,100%,50%,0.1)";
        }
      }

      if (Math.floor(Math.random() * 300) == 5) {
        if (nodes[i].color == "hsla(0,100%,50%,0.2)") {
          nodes[i].color = "hsla(20,100%,50%,0.5)";
        }
      }
      const choice = Math.floor(Math.random() * 5);
      if (Math.floor(Math.random() * 40) != 10) {
        if (choice === 0 && r > 0) {
          nod.y -= options.speed;
        } else if (choice == 1 && c < w - 1) {
          nod.x += options.speed;
        } else if (choice == 2 && r > 0) {
          nod.y -= options.speed;
        } else if (choice == 3 && c > 0) {
          nod.x -= options.speed;
        }
      } else {
        nodes.splice(i, 1);
        i--;
      }
    }
  }

  function draw() {
    if (w != document.body.clientWidth - 4 || h != document.body.clientHeight - 4) {
      w = document.body.clientWidth - 4;
      h = document.body.clientHeight - 4;

      c.width = w;
      c.height = h;
    }
    ctx.clearRect(0, 0, w, h);
    ctx.globalCompositeOperation = "screen";
    for (let c = 0; c < nodes.length; c++) {
      ctx.beginPath();
      ctx.fillStyle = nodes[c].color;
      ctx.arc(nodes[c].x, nodes[c].y, options.squaresize, 0, Math.PI * 2, false);
      ctx.fill();
    }
  }
  document.body.onmousedown = (event) => {
    mouse = {
      x: event.clientX,
      y: event.clientY,
    };
    pressed = true;
  };
  document.body.onmouseup = (event) => {
    mouse = {
      x: event.clientX,
      y: event.clientY,
    };
    pressed = false;
  };
  document.body.onmousemove = (event) => {
    mouse = {
      x: event.clientX,
      y: event.clientY,
    };
  };

  function frame() {
    now = timestamp();
    dt = dt + Math.min(1, (now - last) / 1000);
    while (dt > step) {
      dt = dt - step;
      tick();
    }
    draw();
    last = now;
  }

  createAnimationFrame(frame); // start the first frame
}

export const PenFlame = () => {
  let c!: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return (
    <>
      <canvas ref={c} />
      <div class="instruct">
        <h1>Draw With Fire</h1>
      </div>
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = ``;
export const PenFlameExperiment: Experiment = { title: "Pen Flame", component: PenFlame, imgUrl, description };
