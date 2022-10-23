import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

function main(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;

  const lines: number[] = [];
  const linePitches: number[] = [];
  const lineOffsets: number[] = [];
  const lineDirections: { x: number; y: number }[] = [];
  const lineTimers = [];

  canvas.style.position = "absolute";
  canvas.style.left = document.body.clientWidth / 2 - 250 + "px";
  canvas.style.top = window.innerHeight / 2 - 250 + "px";

  for (let i = 0; i < 30; i++) {
    lines[i] = i / 10;
    lineOffsets[i] = Math.random();
    linePitches[i] = Math.random();
    lineTimers[i] = Math.random();
    lineDirections[i] = {
      x: Math.random(),
      y: Math.random(),
    };
  }

  function tick() {
    const afterLinesCanvas = document.createElement("canvas");
    afterLinesCanvas.width = canvas.width;
    afterLinesCanvas.height = canvas.height;
    const afterLinesCanvasCtx = afterLinesCanvas.getContext("2d")!;
    ctx.clearRect(0, 0, 500, 500);

    ctx.beginPath();
    ctx.strokeStyle = "rgba(213, 49, 119,0.7)";
    ctx.arc(250, 250, 245, 0, 2 * Math.PI);
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.lineCap = "round";
    for (let i = 0; i < lines.length; i++) {
      const sinOffset = Math.sin(2 * Math.PI * lineOffsets[i]) / 2;
      const pitchM = Math.sin(2 * Math.PI * linePitches[i]);
      let renderOn = ctx;
      if (linePitches[i] < 0.5) {
        renderOn = afterLinesCanvasCtx;
      }
      renderOn.lineCap = "round";
      const grd = renderOn.createRadialGradient(250, 250, Math.abs(130 * pitchM), 250, 250, Math.abs(300 * pitchM));
      grd.addColorStop(0, "#02f");
      grd.addColorStop(1, "white");
      renderOn.strokeStyle = grd;
      const end = {
        x: 250 + Math.cos(2 * Math.PI * lines[i]) * 245 * pitchM,
        y: 250 + Math.sin(2 * Math.PI * lines[i]) * 245 * pitchM,
      };
      renderOn.beginPath();
      renderOn.lineWidth = 5;
      renderOn.moveTo(
        250 + Math.cos(2 * Math.PI * lines[i]) * 45 * pitchM,
        250 + Math.sin(2 * Math.PI * lines[i]) * 45 * pitchM
      );
      renderOn.quadraticCurveTo(
        250 + Math.cos(2 * Math.PI * lines[i] + sinOffset / 2) * 200 * pitchM,
        250 + Math.sin(2 * Math.PI * lines[i] + sinOffset / 2) * 200 * pitchM,
        250 + Math.cos(2 * Math.PI * lines[i]) * 245 * pitchM,
        250 + Math.sin(2 * Math.PI * lines[i]) * 245 * pitchM
      );
      renderOn.stroke();
      fcirc(renderOn, end.x, end.y, 5, 1, 15, "rgba(0,0,0,0)");
      lineDirections[i].x = Math.min(Math.max(lineDirections[i].x, 0), 1);
      lineDirections[i].y = Math.min(Math.max(lineDirections[i].y, 0), 1);
      lines[i] += (lineDirections[i].x - 0.5) * 0.003;
      lines[i] = lines[i] % 1;

      linePitches[i] += (lineDirections[i].y - 0.5) * 0.003;
      linePitches[i] = linePitches[i] % 1;
      lineOffsets[i] += (Math.random() - 0.5) * 0.1;
      lineOffsets[i] = lineOffsets[i] % 1;

      lines[i] = lines[i] % 1;
      lineDirections[i].x += Math.random() / 10 - 0.05;
      lineDirections[i].y += Math.random() / 10 - 0.05;
    }
    fcirc(ctx, 250, 250, 45, 30, 55, "white");
    ctx.drawImage(afterLinesCanvas, 0, 0);
  }
  createAnimationFrame(tick);

  function fcirc(
    canva: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    gradient1: number,
    gradient2: number,
    ecolor: string
  ) {
    canva.beginPath();
    canva.lineWidth = 10;
    const grd = ctx.createRadialGradient(x, y, gradient1, x, y, gradient2);
    grd.addColorStop(0, "rgb(213, 49, 119)");
    grd.addColorStop(1, ecolor);
    canva.arc(x, y, size, 0, 2 * Math.PI);
    canva.fillStyle = grd;
    canva.fill();
  }
}

export const PlasmaBall = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return <canvas ref={c!} width="500" height="500" />;
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = `TODO`;
export const PlasmaBallExperiment: Experiment = { title: "Plasma Ball", component: PlasmaBall, imgUrl, description };
