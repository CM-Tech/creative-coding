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
const closestPointOnRoundedRectFromOutside = ({ x: px, y: py }: { x: number, y: number }, x: number, y: number, w: number, h: number, r: number): { x: number, y: number, inside: boolean } => {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  const x0 = x + r;
  const y0 = y + r;
  const x1 = x + w - r;
  const y1 = y + h - r;
  let restrictedInner = { x: Math.min(Math.max(px, x0), x1), y: Math.min(Math.max(py, y0), y1) };
  let d1 = Math.abs(restrictedInner.x - x0);
  let d2 = Math.abs(restrictedInner.x - x1);
  let d3 = Math.abs(restrictedInner.y - y0);
  let d4 = Math.abs(restrictedInner.y - y1);
  let minD = Math.min(d1, d2, d3, d4);
  if (minD === d1) {
    restrictedInner.x = x0;
  } else if (minD === d2) {

    restrictedInner.x = x1;
  } else if (minD === d3) {

    restrictedInner.y = y0;
  } else {

    restrictedInner.y = y1;
  }
  const dx = restrictedInner.x - px;
  const dy = restrictedInner.y - py;
  let d = Math.sqrt(dx * dx + dy * dy);
  if ((x0 / 2 + x1 / 2 - px) * dx + (y0 / 2 + y1 / 2 - py) * dy < 0) {
    d = -d;
  }
  const rx = r * dx / d;
  const ry = r * dy / d;
  return { x: restrictedInner.x - rx, y: restrictedInner.y - ry, inside: Math.hypot(restrictedInner.x - rx - (x0 / 2 + x1 / 2), restrictedInner.y - ry - (y0 / 2 + y1 / 2)) > Math.hypot(px - (x0 / 2 + x1 / 2), py - (y0 / 2 + y1 / 2)) };

}
export const TrafficDots = () => {
  const [lightMode, setLightMode] = createSignal(true);
  let sliderRef: HTMLInputElement;

  let canvasNode: HTMLCanvasElement;
  const [gridSize, setGridSize] = createSignal(20);
  const [sroadWidth, setSRoadWidth] = createSignal(20);
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
    setGridSize(grd)
    const roadWidth = siz * 12;
    setSRoadWidth(roadWidth);
    const rows = Math.floor(height / grd - 1);
    const columns = Math.floor(width / grd - 1);
    const cityGrid = new Array(rows).fill(0).map((_, y) => new Array(columns).fill(0).map((_, x) => ({ x, y, w: 1, h: 1 })));
    const setCityBlock = (x: number, y: number, w: number, h: number) => {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          cityGrid[yy][xx].x = x + 0;
          cityGrid[yy][xx].y = y + 0;
          cityGrid[yy][xx].w = w;
          cityGrid[yy][xx].h = h;
        }
      }
    }
    setCityBlock(0, 0, 4, 1);
    setCityBlock(0, 1, 2, 1);
    setCityBlock(2, 1, 3, 1);
    nodes = d3.range(200).map(() => ({
      r: (12) * siz / 2,
      x: Math.random() * width,
      y: Math.random() * height,
    }));
    (nodes[0] as d3.SimulationNodeDatum & { r: number }).r = 6 * siz;
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

        for (let jg = 0; jg < columns; jg++) {
          for (let jkg = 0; jkg < rows; jkg++) {
            const fC = chroma(!lightMode() ? BASE_DARK : BASE_LIGHT).darken(0).hex();///d3.schemeCategory10[i % 6];
            context.fillStyle = chroma(fC).brighten(!lightMode() ? -1 : 1).hex();

            context.lineWidth = lw;
            context.strokeStyle = chroma(fC).brighten(!lightMode() ? 0 : 0).hex();
            const gx = jg;
            const gy = jkg;
            const { w, h, x, y } = cityGrid[Math.min(Math.max(gy, 0), rows - 1)][Math.min(Math.max(gx, 0), columns - 1)];
            if ((gx === x) && (gy === y)) {
              roundedRect(context, grd * (x + 1 / 2) + roadWidth / 2 + lw / 2, grd * (y + 1 / 2) + roadWidth / 2 + lw / 2, grd * w - roadWidth - lw, grd * h - roadWidth - lw, roadWidth / 2 - lw / 2);

              context.fill();
              context.stroke();
            }

          }
        }
        context.fillStyle = lightMode() ? BASE_DARK : BASE_LIGHT;
        context.font = "bold " + grd / 2.1 + "px 'Noto Sans Mono'";
        context.fillText("Traffic Dots", grd * 0.8, grd * 1.17);
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
          node.x = Math.max(Math.min(node.x, grd * (Math.floor(width / grd) - 0.5) + roadWidth / 2 - node.r), grd / 2 - roadWidth / 2 + node.r);
          node.y = Math.max(Math.min(node.y, grd * (Math.floor(height / grd) - 0.5) + roadWidth / 2 - node.r), grd / 2 - roadWidth / 2 + node.r);
          const close0 = closestPointOnRoundedRectFromOutside({ x: node.x, y: node.y }, grd / 2 - roadWidth / 2 + node.r, grd / 2 - roadWidth / 2 + node.r, grd * (Math.floor(width / grd) - 1) + roadWidth - node.r * 2, grd * (Math.floor(height / grd) - 1) + roadWidth - node.r * 2, roadWidth - node.r);

          // if (i === 0) {
          //   continue;
          // }
          let dig = { x: close0.x - node.x, y: close0.y - node.y };
          let lD = Math.hypot(dig.x, dig.y);
          if (!close0.inside) {

            let N = { x: dig.x / (lD <= 0 ? 1 : lD), y: dig.y / (lD <= 0 ? 1 : lD) };
            // node.vy*=0.5;

            node.x = close0.x;
            node.y = close0.y;
            let dott = (lD <= 0 ? 0 : N.x * node.vx + N.y * node.vy);
            node.vy += -N.y * dott;
            // node.vx*=0.5;
            node.vx += -N.x * dott;

          }
          const gx = Math.floor(node.x / grd - 0.5);
          const gy = Math.floor(node.y / grd - 0.5);
          const { w, h, x, y } = cityGrid[Math.min(Math.max(gy, 0), rows - 1)][Math.min(Math.max(gx, 0), columns - 1)];

          const close = closestPointOnRoundedRectFromOutside({ x: node.x, y: node.y }, (x + 0.5) * grd + roadWidth / 2, (y + 0.5) * grd + roadWidth / 2, grd * w - roadWidth, grd * h - roadWidth, roadWidth / 2);
          const close2 = closestPointOnRoundedRectFromOutside({ x: node.x, y: node.y }, (x + 0.5) * grd + roadWidth / 2 - node.r, (y + 0.5) * grd + roadWidth / 2 - node.r, grd * w - roadWidth + node.r * 2, grd * h - roadWidth + node.r * 2, roadWidth / 2 + node.r);
          if (Math.hypot(close.x - node.x, close.y - node.y) < node.r || close.inside) {
            let di = { x: close.x - node.x, y: close.y - node.y };
            let N = { x: di.x / Math.hypot(di.x, di.y), y: di.y / Math.hypot(di.x, di.y) };

            node.y = close2.y;
            // node.vx*=0.5;
            node.x = close2.x;
            let dott = (N.x * node.vx + N.y * node.vy);
            node.vy += -N.y * dott;
            // node.vx*=0.5;
            node.vx += -N.x * dott;
          }
          // if(Math.abs(node.x%grd-grd/2)>roadWidth/2){
          //   node.vy*=0.5;
          //   node.vy+=((Math.round(node.y/grd-0.5)+0.5)*grd-node.y)/4;
          // }
          // if(Math.abs(node.y%grd-grd/2)>roadWidth/2){
          //   node.vx*=0.5;
          //   node.vx+=((Math.round(node.x/grd-0.5)+0.5)*grd-node.x)/4;
          // }
          // node.x = node.x * 0.9 + (Math.round(node.x / grd + 0.5) * grd - grd / 2) * 0.1;
          // node.y = node.y * 0.9 + (Math.round(node.y / grd + 0.5) * grd - grd / 2) * 0.1;
          if (Math.random() < 0.0015) {
            node.vx = Math.random() < 0.5 ? 5 : -5;
          }
          if (Math.random() < 0.0015) {
            node.vy = Math.random() < 0.5 ? 5 : -5;
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

      <canvas ref={canvasNode!} style={{ width: "100%", height: "100%" }} />
      <div
        style={{
          // "background-color": !lightMode() ? "#4d4d4d" : "#fafafa",
          background: "transparent",
          color: lightMode() ? BASE_DARK : BASE_LIGHT,
          top: gridSize() * (0.5) + "px",
          left: gridSize() * 0.5 + "px",
          "line-height": gridSize() + "px",
          position: "absolute",
          "font-size": gridSize() / 2.1 + "px",
          "font-family": "'Noto Sans Mono'",
          "font-weight": "bold",
          "pointer-events": "none"
        }}
      ><div style={{ display: "flex" }}>
          <div onClick={() => setLightMode((v) => !v)}
            style={{
              "pointer-events": "auto", background: "transparent", border: "none", display: "flex", color: lightMode() ? BASE_DARK : BASE_LIGHT, width: (gridSize() - sroadWidth()) + "px", height: (gridSize() - sroadWidth()) + "px", "margin": sroadWidth() * 0.5 + "px", "margin-left": `${gridSize() * 4 + sroadWidth() * 0.5}px`, "padding": `${gridSize() * 0.25 - sroadWidth() / 2}px`, "box-sizing": "border-box"
            }}
          >
            {lightMode() ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                style={{ width: gridSize() * 0.5 + "px", height: gridSize() * 0.5 + "px" }}
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
                style={{ width: gridSize() * 0.5 + "px", height: gridSize() * 0.5 + "px" }}
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
          </div>
        </div>
        <div style={{ display: "flex" }}>
          <div style={{ "padding-left": `${gridSize() * 0.25}px`, "padding-right": `${gridSize() * 0.25}px`, "box-sizing": "border-box", width: `${gridSize() * 2}px` }}>Force</div>
          <div style={{
            "padding": `${gridSize() * 0.25}px`, "box-sizing": "border-box", width: `${gridSize() * 3}px`, height: `${gridSize() * 1}px`,

            display: "flex"
          }}>
            <input type="range" min={-250} max={250} value={250} ref={sliderRef!} style={{ "pointer-events": "auto", width: "100%" }} className={"cool-slider" + " " + (lightMode() ? "light" : 'dark')} /></div>
        </div>


      </div>
    </>
  );
};
