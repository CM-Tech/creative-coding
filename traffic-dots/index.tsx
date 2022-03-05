import chroma from "chroma-js";
import * as d3 from "d3";
import { createSignal, onCleanup, onMount } from "solid-js";
import { BASE_DARK, BASE_LIGHT, CYAN_MUL, MAGENTA_MUL, YELLOW_MUL } from "../shared/constants";

const dpr = () => window.devicePixelRatio ?? 1;

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
const closestPointOnRoundedRectFromOutside = ({ x: px, y: py }: { x: number, y: number }, x: number, y: number, w: number, h: number, r: number): { x: number, y: number } => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  const x0 = x + r;
  const y0 = y + r;
  const x1 = x + w - r;
  const y1 = y + h - r;
  const restrictedInner = { x: Math.min(Math.max(px, x0), x1), y: Math.min(Math.max(py, y0), y1) };
  const dx = restrictedInner.x - px;
  const dy = restrictedInner.y - py;
  const d = Math.sqrt(dx * dx + dy * dy);
  const rx = r * dx / d;
  const ry = r * dy / d;
  return { x: restrictedInner.x - rx, y: restrictedInner.y - ry };

}
export const TrafficDots = () => {
  const [lightMode, setLightMode] = createSignal(true);
  let sliderRef: HTMLInputElement;

  let canvasNode: HTMLCanvasElement;

  onMount(() => {
    let nodes: d3.SimulationNodeDatum[] = [];
    const chargeRef: d3.ForceManyBody<d3.SimulationNodeDatum & { r: number }> = d3.forceManyBody().strength(0);

    const dp = dpr();
    const width = window.innerWidth;
    const height = window.innerHeight;

    const canvas = d3
      .select(canvasNode)
      .attr("width", width * dp)
      .attr("height", height * dp);
    const context = canvasNode.getContext("2d")!;

    const blur = false;
    console.log("Q", width, height);
    const siz = Math.sqrt((width * height) / 16000000) * 5;
    const grd = siz * 50;
    const roadWidth = siz * 12;
    nodes = d3.range(200).map(() => ({
      r: (12) * siz / 2,
      x: Math.random() * width,
      y: Math.random() * height,
    }));
    (nodes[0] as d3.SimulationNodeDatum & { r: number }).r = 20 * siz;
    const fSim = d3.forceSimulation(nodes)
      .alphaDecay(0)
      .velocityDecay(0.00)
      .force("charge", chargeRef)
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d, i) => (d as d3.SimulationNodeDatum & { r: number }).r * (i === 0 ? 1 : Math.sqrt(2)))
          .iterations(20)
      )
      .on("tick", () => {
        brownian();
        context.resetTransform();
        context.scale(dp, dp);
        context.fillStyle = blur
          ? !lightMode()
            ? "rgba(0,0,0,.1)"
            : "rgba(255,255,255,.1)"
          : chroma(!lightMode()
            ? chroma(BASE_DARK).darken(0).hex()
            : chroma(BASE_LIGHT).darken(0).hex()).brighten(!lightMode() ? -1 : 1).hex();
        context.fillRect(0, 0, width, height);
        const lc = 1;
        context.lineWidth = lc;
        const brightness = lightMode() ? 255 - 27 - 27 : 77 * 2 - 104;
        const dbrightness = lightMode() ? 255 : 104;
        const lw = 4;
        context.lineWidth = lw;
        context.strokeStyle = chroma.mix(BASE_DARK, BASE_LIGHT, lightMode() ? 1 : 0).hex();//"rgb(" + dbrightness + "," + dbrightness + "," + dbrightness + ")";
        const rBK = !lightMode() ? chroma(BASE_DARK).darken(0.0).hex() : chroma(BASE_LIGHT).darken(0.0).hex();
        context.fillStyle = chroma(!lightMode()
          ? chroma(BASE_DARK).darken(0).hex()
          : chroma(BASE_LIGHT).darken(0).hex()).brighten(!lightMode() ? -1 : 1).hex();
        roundedRect(context, grd / 2 - roadWidth / 2 - lw / 2, grd / 2 - roadWidth / 2 - lw / 2, grd * (Math.floor(width / grd) - 1) + roadWidth + lw, grd * (Math.floor(height / grd) - 1) + roadWidth + lw, roadWidth / 2 * 2 + lw / 2);

        context.fill();
        context.stroke();
        context.fillStyle = lightMode() ? chroma(BASE_LIGHT).darken(-0.5).hex() : chroma(BASE_DARK).darken(-0.5).hex();//"rgb(" + dbrightness + "," + dbrightness + "," + dbrightness + ")";

        for (let jg = grd / 2; jg < width - grd / 2 * 3; jg += grd) {
          const j = Math.floor(jg * dp) / dp;
          for (let jkg = grd / 2; jkg < height - grd / 2 * 3; jkg += grd) {
            const jk = Math.floor(jkg * dp) / dp;
            const fC = chroma(!lightMode() ? BASE_DARK : BASE_LIGHT).darken(0).hex();///d3.schemeCategory10[i % 6];
            context.fillStyle = chroma(fC).brighten(!lightMode() ? -1 : 1).hex();

            context.lineWidth = lw;
            context.strokeStyle = chroma(fC).brighten(!lightMode() ? 0 : 0).hex();
            roundedRect(context, j + roadWidth / 2 + lw / 2, jk + roadWidth / 2 + lw / 2, grd - roadWidth - lw, grd - roadWidth - lw, roadWidth / 2 - lw / 2);

            context.fill();
            context.stroke();
          }
        }
        context.globalCompositeOperation = "source-over";

        nodes.slice(0).forEach((dg, i) => {
          const d = dg as d3.SimulationNodeDatum & { r: number };
          if (d.x !== undefined && d.y !== undefined && d.r !== undefined) {
            const fC = i === 0 ? (lightMode() ? BASE_DARK : BASE_LIGHT) : ([CYAN_MUL, chroma.blend(CYAN_MUL, MAGENTA_MUL, "multiply").hex(), MAGENTA_MUL, chroma.blend(MAGENTA_MUL, YELLOW_MUL, "multiply").hex(), YELLOW_MUL, chroma.blend(YELLOW_MUL, CYAN_MUL, "multiply").hex()][i % 6]);///d3.schemeCategory10[i % 6];
            context.fillStyle = chroma
              .blend(chroma(fC).brighten(!lightMode() ? -1 : 1), rBK, !lightMode() ? "screen" : "multiply")
              .hex();
            context.lineWidth = lw;
            context.strokeStyle = chroma
              .blend(chroma(fC).brighten(!lightMode() ? 0 : 0), rBK, !lightMode() ? "screen" : "multiply")
              .hex();
            // context.beginPath();
            // context.moveTo(d.x + d.r, d.y);
            // context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            context.save();
            let vg = { x: d.x % grd - grd / 2, y: d.y % grd - grd / 2 };//{x:d.vx,y:d.vy};//{x:d.x%grd-grd/2,y:d.y%grd-grd/2};

            context.translate(d.x, d.y);
            if (i === 0) {
              roundedRect(context, - d.r + lw / 2, - d.r + lw / 2, d.r * 2 - lw, d.r * 2 - lw, d.r - lw / 2);
            } else {
              context.rotate(-Math.atan2(vg.y, vg.x));
              roundedRect(context, - d.r + lw / 2, - d.r + lw / 2, d.r * 2 - lw, d.r * 2 - lw, d.r / 2 - lw / 2);
            }


            context.fill();
            context.stroke();
            context.restore();

            // context.fillStyle = "rgba(255,255,255,0.45)";
            // context.beginPath();
            // context.moveTo(d.x + d.r, d.y);
            // context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            // context.fill();

            // context.lineWidth = 1;
            // context.strokeStyle = "rgba(0,0,0,0.8)";
            // context.beginPath();
            // context.arc(d.x, d.y, d.r - 0.5, 0, 2 * Math.PI);
            // context.stroke();

            // context.save();
            // context.beginPath();
            // context.arc(d.x, d.y, d.r - 1, 0, 2 * Math.PI);
            // context.clip();
            // context.fillStyle = fC;
            // context.beginPath();
            // context.arc(d.x, d.y + 1, d.r - 1, 0, 2 * Math.PI);
            // context.fill();
            // context.restore();

            // context.lineWidth = 1;
            // context.strokeStyle = "rgba(255,255,255,0.32)";
            // context.beginPath();
            // context.arc(d.x, d.y, d.r - 0.5 - 1, 0, 2 * Math.PI);
            // context.stroke();
          }
        });

        context.globalCompositeOperation = "source-over";
      });
    function brownian() {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.x !== undefined && node.y !== undefined) {
          nodes[i].x = Math.max(Math.min(node.x, grd * (Math.floor(width / grd) - 0.5)), grd / 2);
          nodes[i].y = Math.max(Math.min(node.y, grd * (Math.floor(height / grd) - 0.5)), grd / 2);
          const close0 = closestPointOnRoundedRectFromOutside({ x: nodes[i].x, y: nodes[i].y }, grd / 2, grd / 2, grd * (Math.floor(width / grd) - 1), grd * (Math.floor(height / grd) - 1), roadWidth);

          if (i === 0) {
            continue;
          }
          if ((nodes[i].x < grd / 2 + roadWidth || nodes[i].x > grd * (Math.floor(width / grd) - 0.5) - roadWidth) && (nodes[i].y < grd / 2 + roadWidth || nodes[i].y > grd * (Math.floor(height / grd) - 0.5) - roadWidth)) {
            let di = { x: close0.x - nodes[i].x, y: close0.y - nodes[i].y };
            let N = { x: di.x / Math.hypot(di.x, di.y), y: di.y / Math.hypot(di.x, di.y) };
            // nodes[i].vy*=0.5;

            nodes[i].x = close0.x;
            nodes[i].y = close0.y;
            let dott = N.x * nodes[i].vx + N.y * nodes[i].vy;
            nodes[i].vy += -N.y * dott;
            // nodes[i].vx*=0.5;
            nodes[i].vx += -N.x * dott;

          }
          const roundRectCenter = {
            x: Math.floor(node.x / grd + 0.5) * grd,
            y: Math.floor(node.y / grd + 0.5) * grd,
          };
          const close = closestPointOnRoundedRectFromOutside({ x: nodes[i].x, y: nodes[i].y }, roundRectCenter.x - grd / 2 + roadWidth / 2, roundRectCenter.y - grd / 2 + roadWidth / 2, grd - roadWidth, grd - roadWidth, roadWidth / 2);
          const close2 = closestPointOnRoundedRectFromOutside({ x: nodes[i].x, y: nodes[i].y }, roundRectCenter.x - grd / 2, roundRectCenter.y - grd / 2, grd, grd, roadWidth);
          if (Math.hypot(close.x - nodes[i].x, close.y - nodes[i].y) < nodes[i].r) {
            let di = { x: close.x - nodes[i].x, y: close.y - nodes[i].y };
            let N = { x: di.x / Math.hypot(di.x, di.y), y: di.y / Math.hypot(di.x, di.y) };

            nodes[i].y = close2.y;
            // nodes[i].vx*=0.5;
            nodes[i].x = close2.x;
            let dott = N.x * nodes[i].vx + N.y * nodes[i].vy;
            nodes[i].vy += -N.y * dott;
            // nodes[i].vx*=0.5;
            nodes[i].vx += -N.x * dott;
          }
          // if(Math.abs(node.x%grd-grd/2)>roadWidth/2){
          //   nodes[i].vy*=0.5;
          //   nodes[i].vy+=((Math.round(node.y/grd-0.5)+0.5)*grd-nodes[i].y)/4;
          // }
          // if(Math.abs(node.y%grd-grd/2)>roadWidth/2){
          //   nodes[i].vx*=0.5;
          //   nodes[i].vx+=((Math.round(node.x/grd-0.5)+0.5)*grd-nodes[i].x)/4;
          // }
          // nodes[i].x = node.x * 0.9 + (Math.round(node.x / grd + 0.5) * grd - grd / 2) * 0.1;
          // nodes[i].y = node.y * 0.9 + (Math.round(node.y / grd + 0.5) * grd - grd / 2) * 0.1;
          if (Math.random() < 0.0015) {
            nodes[i].vx = Math.random() < 0.5 ? 5 : -5;
          }
          if (Math.random() < 0.0015) {
            nodes[i].vy = Math.random() < 0.5 ? 5 : -5;
          }
        }
      }
    }
    canvas.on("mousemove", (event) => {
      const p1 = d3.pointer(event, canvas.node());
      nodes[0].fx = p1[0];
      nodes[0].fy = p1[1];
    });
    const dV = 200;
    canvas.on("mousedown", () => {
      chargeRef.strength((_, i) => (i == 0 ? sliderRef.valueAsNumber ?? dV : 0) * Math.pow(grd / 10 / 20, 2));
    });
    canvas.on("mouseup", () => {
      chargeRef.strength(0);
    });
    onCleanup(() => {
      fSim.stop();
    });
  });

  return (
    <>
      <div
        style={{
          // "background-color": !lightMode() ? "#4d4d4d" : "#fafafa",
          background: "transparent",
          color: lightMode() ? BASE_DARK : BASE_LIGHT,
        }}
        class="well"
      >
        <span>Strength</span>
        <input type="range" min={-250} max={250} value={250} ref={sliderRef!} />
        <span>Theme mode</span>
        <button onClick={() => setLightMode((v) => !v)}
          style={{ background: "transparent", border: "none", color: lightMode() ? BASE_DARK : BASE_LIGHT, }}
        >
          {lightMode() ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "1.5rem", height: "1.5rem" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              style={{ width: "1.5rem", height: "1.5rem" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          )}
        </button>
      </div>
      <canvas ref={canvasNode!} style={{ width: "100%", height: "100%" }} />
    </>
  );
};
