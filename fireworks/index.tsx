import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

const dpr = () => window.devicePixelRatio ?? 1;

type FireworkParticle = {
  life: number;
  startLife: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  type?: number;
  f_type?: number;
  color: { r: number; g: number; b: number };
  split: number[];
  typ: number[];
  ix: number;
};

export const Fireworks = () => {
  let nodesRef: FireworkParticle[] = [];

  let canvasNode: HTMLCanvasElement;

  onMount(() => {
    const dp = dpr();
    const width = window.innerHeight;
    const height = window.innerWidth;

    canvasNode.width = width * dp;
    canvasNode.height = height * dp;
    let context: CanvasRenderingContext2D = canvasNode.getContext("2d") as CanvasRenderingContext2D;

    const tick = () => {
      context.resetTransform();
      context.scale(dp, dp);
      context.globalCompositeOperation = "source-over";
      context.fillStyle = "rgba(0,0,0,0.1)";
      context.fillRect(0, 0, width, height);
      const scaleUnit = height / 10;

      if (Math.random() > 0.75) {
        let ty = Math.random() > 0.05 ? 0 : 2;
        nodesRef.push({
          x: Math.random() * width,
          y: height,
          vx: (Math.random() * 2 - 1) * scaleUnit,
          vy: -4 * scaleUnit + (Math.random() * 2 - 1) * scaleUnit * 2,
          color: { r: Math.random(), g: Math.random(), b: Math.random() },
          r: ty === 2 ? 16 : 2,
          life: 2000,
          startLife: 2000,
          type: ty,
          typ: [ty],
          split: [Math.floor(Math.random() * 2) + 6],
          ix: 0,
        });
      }
      const newNodes: FireworkParticle[] = [];
      let ig = 0;
      for (let n of nodesRef) {
        ig += 1;
        n.life -= 1000 / 60;
        const lastX = n.x;
        const lastY = n.y;
        n.x += (n.vx * 1) / 60;
        n.y += (n.vy * 1) / 60;
        n.vy += (1 / 60) * 2 * scaleUnit;
        if (n.life > 0) {
          newNodes.push(n);
          let m = n.life / n.startLife + Math.log2(n.r) * 1;
          if (n.f_type === 1) {
            m *= 0.5 + Math.sin(n.life + ig) / 2 > 0.7 ? 1 : 0;
          }
          context.globalCompositeOperation = "lighter";
          if (n.f_type === 1) {
            context.fillStyle = `rgba(${Math.floor(n.color.r * 255 * m)},${Math.floor(
              n.color.g * 255 * m
            )},${Math.floor(n.color.b * 255 * m)},1)`;
            let rr = Math.min(n.r, 2);
            context.fillRect(n.x - rr / 2, n.y - rr / 2, rr, rr);
          } else {
            context.strokeStyle = `rgba(${Math.floor(n.color.r * 255 * m)},${Math.floor(
              n.color.g * 255 * m
            )},${Math.floor(n.color.b * 255 * m)},1)`;
            let rr = Math.min(n.r, 2);
            context.lineWidth = rr;
            context.beginPath();
            context.moveTo(lastX, lastY);
            context.lineTo(n.x, n.y);
            context.stroke();
          }
        } else {
          if (n.r > 1) {
            let nnr = n.r / 2;
            n.color.r = Math.random();
            n.color.g = Math.random();
            n.color.b = Math.random();
            if (n.split.length < n.ix + 2) {
              n.split.push(Math.floor(Math.random() * 2) + (n.ix === 0 ? 6 : 3));
            }

            let nL = n.startLife / 2 + (Math.random() * n.startLife) / 8;
            let nT = 0;
            if (Math.random() < 0.2) {
              nT = 1;
              nL = n.startLife * 0.75 + (Math.random() * n.startLife) / 4;
            }
            let tyy = 0;
            if (n.type === 2) {
              tyy = 2;
              if (Math.random() < 0.5 && n.ix < 1) {
                tyy = 0;
              }
            }
            if (n.typ.length < n.ix + 2) {
              n.typ.push(tyy);
            }
            tyy = n.typ[n.ix + 1];
            if (n.type === 2 && tyy !== 2) {
              nnr /= 4;
            }
            let q = Math.random();
            let sp = n.split[n.ix + 1];
            for (let i = 0; i < (n.type === 2 ? sp : 100); i++) {
              let oa = (n.type === 2 ? i / sp + q : Math.random()) * Math.PI * 2;
              let or = (n.type === 2 ? 0.4 : Math.random()) + 0.1;
              let ox = Math.cos(oa) * or;
              let oy = Math.sin(oa) * or;
              let rg = Math.random() + 1;
              newNodes.push({
                x: n.x,
                y: n.y,
                vx: ox * scaleUnit * rg + n.vx * 0,
                vy: oy * scaleUnit * rg - scaleUnit + n.vy * 0,
                color: n.color,
                r: nnr,
                life: nL,
                startLife: nL,
                f_type: nT,
                type: tyy,
                split: n.split,
                ix: n.ix + 1,
                typ: n.typ,
              });
            }
          }
        }
      }
      nodesRef = newNodes;
    };
    createAnimationFrame(tick);
  });

  return <canvas ref={canvasNode!} />;
};
