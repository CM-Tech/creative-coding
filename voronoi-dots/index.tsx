import * as d3 from "d3";
import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

const dpr = () => window.devicePixelRatio ?? 1;
const CYAN_MUL = "#55EEEE";
const YELLOW_MUL = "#EEBB66";
const MAGENTA_MUL = "#EE55EE";
const WHITE = "#EBE8E7";

export const VoronoiDots = () => {
  const width = window.innerWidth;
  const height = window.innerHeight;

  let canvas: HTMLCanvasElement;
  let slider: HTMLInputElement;

  const nodes = d3.range((width * height) / 900).map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: 0,
    vy: 0,
    fx: undefined as number | undefined,
    fy: undefined as number | undefined,
  }));
  const charge = d3.forceManyBody().theta(0.8).strength(0);
  let white = 0;

  onMount(() => {
    const context = canvas.getContext("2d")!;
    const render = () => {
      const diagram = d3.Delaunay.from(nodes.slice(1).map((d) => [d.x, d.y])).voronoi([-1, -1, width + 1, height + 1]);
      const polygons = diagram.cellPolygons();
      context.resetTransform();
      context.scale(dpr(), dpr());
      context.clearRect(0, 0, width, height);
      context.fillStyle = WHITE;
      context.fillRect(0, 0, width, height);

      context.lineWidth = 1;
      const brightness = 128 + (white ? 100 : -60);
      context.strokeStyle = "rgb(" + brightness + "," + brightness + "," + brightness + ")";
      // for (let j = 10; j < width + 10; j += 20) {
      //   context.beginPath();
      //   context.moveTo(j + 0.5, 10);
      //   context.lineTo(j + 0.5, Math.round(height / 20) * 20 - 10);
      //   context.stroke();
      // }
      // for (let j = 10; j < height + 10; j += 20) {
      //   context.beginPath();
      //   context.moveTo(10, j + 0.5);
      //   context.lineTo(width - 10, j + 0.5);
      //   context.stroke();
      // }
      context.globalCompositeOperation = "multiply";
      for (const cell of polygons) {
        const color = [CYAN_MUL, MAGENTA_MUL, YELLOW_MUL][(cell.index + white) % 3];
        const node = nodes[cell.index + 1];
        context.fillStyle = color; //color;
        context.strokeStyle = color;
        context.lineWidth = 2;
        context.beginPath();
        context.moveTo(cell[0][0], cell[0][1]);
        for (let j = 1; j < cell.length; ++j) {
          context.lineTo(cell[j][0], cell[j][1]);
        }
        context.closePath();
        // context.fill();
        context.stroke();
        context.beginPath();
        context.arc(node.x, node.y, 4, 0, Math.PI * 2);
        context.fill();
      }

      context.globalCompositeOperation = "source-over";
    };
    createAnimationFrame(render);
    d3.forceSimulation(nodes)
      .alphaDecay(0)
      .velocityDecay(0.05)
      .force("charge", charge)
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((_, i) => (i == 0 ? 17 : 11))
          .iterations(10)
      )
      .on("tick", () => {
        brownian();
      });

    function brownian() {
      for (let i = 0; i < nodes.length; i++) {
        nodes[i].x = Math.max(Math.min(nodes[i].x, width - 10), 10);
        nodes[i].y = Math.max(Math.min(nodes[i].y, height - 10), 10);

        if (Math.random() < 0.0015) {
          nodes[i].vx = Math.random() < 0.5 ? 5 : -5;
        }
        if (Math.random() < 0.0015) {
          nodes[i].vy = Math.random() < 0.5 ? 5 : -5;
        }
      }
    }
  });
  let charged = false;
  function twhite() {
    white += 1;
  }
  return (
    <>
      <div class="well">
        {/* <button onclick={twhite}>Toggle Theme</button> */}
        <input type="range" ref={slider!} max="200" min="-200" value="-200" step="10" style="width:400px" />
      </div>
      <canvas
        ref={canvas!}
        width={window.innerWidth * dpr()}
        height={window.innerHeight * dpr()}
        style={{ width: "100%", height: "100%" }}
        onmousemove={(e) => {
          const p1 = d3.pointer(e);
          nodes[0].fx = p1[0];
          nodes[0].fy = p1[1];
        }}
        onmousedown={() => {
          charged = true;
          charge.strength((_, i) => (i == 0 ? +slider.value : 0));
        }}
        onmouseup={() => {
          charged = false;
          charge.strength(0);
        }}
        onwheel={(e) => {
          const delta = -e.deltaY;
          slider.value = `${+slider.value - Math.max(-1, Math.min(1, delta)) * 10}`;

          if (charged) charge.strength((_, i) => (i == 0 ? +slider.value : 0));
        }}
      />
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = ``;
export const VoronoiDotsExperiment: Experiment = { title: "Voronoi Dots", component: VoronoiDots, imgUrl, description };
