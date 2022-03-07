import chroma from "chroma-js";
import * as d3 from "d3";
import { createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js";
import { BASE_DARK, BASE_LIGHT, CYAN_MUL, MAGENTA_MUL, YELLOW_MUL } from "../shared/constants";
import { createSizeSignal } from "../utils";

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  let rr = Math.max(r, 0);
  if (w < 2 * rr) rr = w / 2;
  if (h < 2 * rr) rr = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

const surfacePointOnRoundedRect = ({ x: px, y: py }: { x: number, y: number }, x: number, y: number, w: number, h: number, rr: number): { x: number, y: number, signedDistance: number } => {
  let r = Math.max(rr, 0);
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  const x0 = x + r;
  const y0 = y + r;
  const x1 = x + w - r;
  const y1 = y + h - r;
  const onSharp = { x: Math.min(Math.max(px, x0), x1), y: Math.min(Math.max(py, y0), y1) };
  const d1 = Math.abs(onSharp.x - x0);
  const d2 = Math.abs(onSharp.x - x1);
  const d3 = Math.abs(onSharp.y - y0);
  const d4 = Math.abs(onSharp.y - y1);
  const minD = Math.min(d1, d2, d3, d4);
  let surfaceNormal = { x: 0, y: 0 };
  if (minD === d1) {
    surfaceNormal = { x: -1, y: 0 };
    onSharp.x = x0;
  } else if (minD === d2) {
    surfaceNormal = { x: 1, y: 0 };
    onSharp.x = x1;
  } else if (minD === d3) {
    surfaceNormal = { x: 0, y: -1 };
    onSharp.y = y0;
  } else {
    surfaceNormal = { x: 0, y: 1 };
    onSharp.y = y1;
  }
  const insideOrOnSharp = (Math.abs(x0 - (x0 / 2 + x1 / 2)) >= Math.abs(px - (x0 / 2 + x1 / 2))) && (Math.abs(y0 - (y0 / 2 + y1 / 2)) >= Math.abs(py - (y0 / 2 + y1 / 2)));

  const dx = px - onSharp.x;
  const dy = py - onSharp.y;
  const sharpUnsignedDistance = Math.sqrt(dx * dx + dy * dy);
  let signedDistance = sharpUnsignedDistance - r;
  if (sharpUnsignedDistance > 0 && !insideOrOnSharp) {
    surfaceNormal = { x: dx / sharpUnsignedDistance, y: dy / sharpUnsignedDistance };
  } else {
    signedDistance = -sharpUnsignedDistance - r;
  }
  return { x: px - signedDistance * surfaceNormal.x, y: py - signedDistance * surfaceNormal.y, signedDistance };

}

const M_PALETTE = ([CYAN_MUL, chroma.blend(CYAN_MUL, MAGENTA_MUL, "multiply").hex(), MAGENTA_MUL, chroma.blend(MAGENTA_MUL, YELLOW_MUL, "multiply").hex(), YELLOW_MUL, chroma.blend(YELLOW_MUL, CYAN_MUL, "multiply").hex()]);
type TrafficDotSimulationNodeDatum = d3.SimulationNodeDatum & { r: number };
export const TrafficDots = () => {
  const [lightMode, setLightMode] = createSignal(true);
  let sliderRef: HTMLInputElement;

  let canvasNode: HTMLCanvasElement;
  const { width: windowWidth, height: windowHeight, dpr: DP } = createSizeSignal();

  const unit = createMemo(() => Math.sqrt((windowWidth() * windowHeight()) / 16000000) * 5);
  const rBK = createMemo(() => lightMode() ? BASE_LIGHT : BASE_DARK);
  const PALETTE_FILL = createMemo(() => M_PALETTE.map((c) => chroma
    .blend(chroma(c).brighten(!lightMode() ? -1 : 1), rBK(), !lightMode() ? "screen" : "multiply")
    .hex()));
  const PALETTE_STROKE = createMemo(() => M_PALETTE.map((c) => chroma
    .blend(chroma(c), rBK(), !lightMode() ? "screen" : "multiply")
    .hex()));


  const gridSize = createMemo(() => unit() * 48);
  const roadWidth = createMemo(() => unit() * 12);
  const blockBorderRadius = createMemo(() => unit() * 9);
  const citySize = createMemo(() => {
    return { x: Math.floor(windowWidth() / gridSize() - 1), y: Math.floor(windowHeight() / gridSize() - 1) }
  });
  const cityGrid = createMemo(() => {
    const cg = new Array(citySize().y).fill(0).map((_, y) => new Array(citySize().x).fill(0).map((_, x) => ({ x, y, w: 1, h: 1 })));
    const setCityBlock = (x: number, y: number, w: number, h: number) => {
      for (let yy = y; yy < y + h; yy++) {
        for (let xx = x; xx < x + w; xx++) {
          cg[yy][xx].x = x + 0;
          cg[yy][xx].y = y + 0;
          cg[yy][xx].w = w;
          cg[yy][xx].h = h;
        }
      }
    }
    setCityBlock(0, 0, 4, 1);
    setCityBlock(0, 1, 2, 1);
    setCityBlock(2, 1, 3, 1);
    return cg;
  });
  onMount(() => {
    let nodes: TrafficDotSimulationNodeDatum[] = [];
    const chargeRef: d3.ForceManyBody<TrafficDotSimulationNodeDatum> = d3.forceManyBody().strength(0);


    const canvas = d3
      .select(canvasNode);
    createEffect(() => {

      canvas.attr("width", windowWidth() * DP())
        .attr("height", windowHeight() * DP())
    });
    const context = canvasNode.getContext("2d")!;

    const blur = false;
    console.log("Q", windowWidth(), windowHeight());

    nodes = d3.range(200).map(() => ({
      r: (6) * unit(),
      x: Math.random() * windowWidth(),
      y: Math.random() * windowHeight(),
    }));
    nodes[0].r = 6 * unit();
    createEffect(() => {
      nodes.forEach((x) => {
        x.r = 6 * unit()
      })
    });
    const fSim = d3.forceSimulation(nodes)
      .alphaDecay(0)
      .velocityDecay(0.00)
      .force("charge", chargeRef)
      .force(
        "collide",
        d3
          .forceCollide<TrafficDotSimulationNodeDatum>()
          .radius((d, i) => d.r * (i === 0 ? 1 : Math.sqrt(2)))
          .iterations(20)
      )
      .on("tick", () => {
        brownian();
        context.resetTransform();
        context.scale(DP(), DP());
        context.fillStyle = blur
          ? !lightMode()
            ? "rgba(0,0,0,.1)"
            : "rgba(255,255,255,.1)"
          : chroma(!lightMode()
            ? chroma(BASE_DARK).darken(0).hex()
            : chroma(BASE_LIGHT).darken(0).hex()).brighten(!lightMode() ? -1 : 1).hex();
        context.fillRect(0, 0, windowWidth(), windowHeight());
        const lc = 1;
        context.lineWidth = lc;
        const lw = 4;
        context.lineWidth = lw;
        context.strokeStyle = chroma.mix(BASE_DARK, BASE_LIGHT, lightMode() ? 1 : 0).hex();

        context.fillStyle = chroma(!lightMode()
          ? chroma(BASE_DARK).darken(0).hex()
          : chroma(BASE_LIGHT).darken(0).hex()).brighten(!lightMode() ? -1 : 1).hex();
        roundedRect(context, gridSize() / 2 - roadWidth() / 2 - lw / 2, gridSize() / 2 - roadWidth() / 2 - lw / 2, gridSize() * citySize().x + roadWidth() + lw, gridSize() * citySize().y + roadWidth() + lw, blockBorderRadius() + roadWidth() + lw / 2);

        context.fill();
        context.stroke();
        context.fillStyle = lightMode() ? chroma(BASE_LIGHT).darken(-0.5).hex() : chroma(BASE_DARK).darken(-0.5).hex();

        const fCg = chroma(!lightMode() ? BASE_DARK : BASE_LIGHT).darken(0).hex();
        context.fillStyle = chroma(fCg).brighten(!lightMode() ? -1 : 1).hex();

        context.lineWidth = lw;
        context.strokeStyle = chroma(fCg).brighten(!lightMode() ? 0 : 0).hex();

        for (let jg = 0; jg < citySize().x; jg++) {
          for (let jkg = 0; jkg < citySize().y; jkg++) {
            const gx = jg;
            const gy = jkg;
            const { w, h, x, y } = cityGrid()[Math.min(Math.max(gy, 0), citySize().y - 1)][Math.min(Math.max(gx, 0), citySize().x - 1)];
            if ((gx === x) && (gy === y)) {
              roundedRect(context, gridSize() * (x + 1 / 2) + roadWidth() / 2 + lw / 2, gridSize() * (y + 1 / 2) + roadWidth() / 2 + lw / 2, gridSize() * w - roadWidth() - lw, gridSize() * h - roadWidth() - lw, blockBorderRadius() - lw / 2);

              context.fill();
              context.stroke();
            }

          }
        }
        context.fillStyle = lightMode() ? BASE_DARK : BASE_LIGHT;
        context.font = "bold " + gridSize() / 2.1 + "px 'Noto Sans Mono'";
        context.fillText("Traffic Dots", gridSize() * 0.8, gridSize() * 1.17);
        context.globalCompositeOperation = "source-over";
        nodes.slice(0).forEach((dg, i) => {
          const d = dg;
          if (d.x !== undefined && d.y !== undefined && d.r !== undefined) {
            const fC = i === 0 ? (lightMode() ? BASE_DARK : BASE_LIGHT) : M_PALETTE[i % 6];
            context.fillStyle = i === 0 ?

              chroma
                .blend(chroma(fC).brighten(!lightMode() ? -1 : 1), rBK(), !lightMode() ? "screen" : "multiply")
                .hex() : PALETTE_FILL()[i % 6];
            context.lineWidth = lw;
            context.strokeStyle = i === 0 ?

              chroma
                .blend(chroma(fC).brighten(!lightMode() ? -1 : 1), rBK(), !lightMode() ? "screen" : "multiply")
                .hex() : PALETTE_STROKE()[i % 6];

            context.save();
            const vg = { x: d.x % gridSize() - gridSize() / 2, y: d.y % gridSize() - gridSize() / 2 };

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
          }
        });

        context.globalCompositeOperation = "source-over";
      });
    function brownian() {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.x !== undefined && node.y !== undefined) {
          node.x = Math.max(Math.min(node.x, gridSize() * (Math.floor(windowWidth() / gridSize()) - 0.5) + roadWidth() / 2 - node.r), gridSize() / 2 - roadWidth() / 2 + node.r);
          node.y = Math.max(Math.min(node.y, gridSize() * (Math.floor(windowHeight() / gridSize()) - 0.5) + roadWidth() / 2 - node.r), gridSize() / 2 - roadWidth() / 2 + node.r);
          const close0 = surfacePointOnRoundedRect({ x: node.x, y: node.y }, gridSize() / 2 - roadWidth() / 2 + node.r, gridSize() / 2 - roadWidth() / 2 + node.r, gridSize() * citySize().x + roadWidth() - node.r * 2, gridSize() * (Math.floor(windowHeight() / gridSize()) - 1) + roadWidth() - node.r * 2, blockBorderRadius() + roadWidth() - node.r);
          if (close0.signedDistance > 0) {
            const dig = { x: close0.x - node.x, y: close0.y - node.y };
            const lD = Math.hypot(dig.x, dig.y);
            const normal = { x: dig.x / (lD <= 0 ? 1 : lD), y: dig.y / (lD <= 0 ? 1 : lD) };
            node.x = close0.x;
            node.y = close0.y;
            const velocityAlongNormal = (lD <= 0 ? 0 : normal.x * (node.vx ?? 0) + normal.y * (node.vy ?? 0));
            node.vx = (node.vx ?? 0) - normal.x * velocityAlongNormal;
            node.vy = (node.vy ?? 0) - normal.y * velocityAlongNormal;

          }

          const gx = Math.floor(node.x / gridSize() - 0.5);
          const gy = Math.floor(node.y / gridSize() - 0.5);
          const { w, h, x, y } = cityGrid()[Math.min(Math.max(gy, 0), citySize().y - 1)][Math.min(Math.max(gx, 0), citySize().x - 1)];

          const close2 = surfacePointOnRoundedRect({ x: node.x, y: node.y }, (x + 0.5) * gridSize() + roadWidth() / 2 - node.r, (y + 0.5) * gridSize() + roadWidth() / 2 - node.r, gridSize() * w - roadWidth() + node.r * 2, gridSize() * h - roadWidth() + node.r * 2, blockBorderRadius() + node.r);
          if (close2.signedDistance < 0) {
            const dig = { x: close2.x - node.x, y: close2.y - node.y };
            const lD = Math.hypot(dig.x, dig.y);
            const normal = { x: dig.x / (lD <= 0 ? 1 : lD), y: dig.y / (lD <= 0 ? 1 : lD) };
            node.x = close2.x;
            node.y = close2.y;
            const velocityAlongNormal = (lD <= 0 ? 0 : normal.x * (node.vx ?? 0) + normal.y * (node.vy ?? 0));
            node.vx = (node.vx ?? 0) - normal.x * velocityAlongNormal;
            node.vy = (node.vy ?? 0) - normal.y * velocityAlongNormal;

          }

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
      chargeRef.strength((_, i) => (i == 0 ? sliderRef.valueAsNumber ?? dV : 0) * Math.pow(gridSize() / 10 / 20, 2));
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
      >
        <div style={{ display: "flex" }}>
          <div onClick={() => setLightMode((v) => !v)}
            style={{
              "pointer-events": "auto", background: "transparent", border: "none", display: "flex", color: lightMode() ? BASE_DARK : BASE_LIGHT, width: (gridSize() - roadWidth()) + "px", height: (gridSize() - roadWidth()) + "px", "margin": roadWidth() * 0.5 + "px", "margin-left": `${gridSize() * 4 + roadWidth() * 0.5}px`, "padding": `${gridSize() * 0.25 - roadWidth() / 2}px`, "box-sizing": "border-box"
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
            "padding": `${gridSize() * 0.5 - 1 * DP()}px`, "box-sizing": "border-box", width: `${gridSize() * 3}px`, height: `${gridSize() * 1}px`,

            display: "flex"
          }}>
            <input type="range" min={-250} max={250} value={250} ref={sliderRef!} style={{ "pointer-events": "auto", width: "100%" }} className={"cool-slider" + " " + (lightMode() ? "light" : 'dark')} />
          </div>
        </div>
      </div>
    </>
  );
};
