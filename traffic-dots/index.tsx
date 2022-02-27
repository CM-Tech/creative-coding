import * as d3 from "d3";
import { createSignal, onMount } from "solid-js";

const dpr = () => window.devicePixelRatio ?? 1;

export const TrafficDots = () => {
  const [white, setWhite] = createSignal(true);
  let sliderRef: HTMLInputElement;

  let canvasNode: HTMLCanvasElement;

  onMount(() => {
    let nodes: d3.SimulationNodeDatum[] = [];
    let chargeRef: d3.ForceManyBody<d3.SimulationNodeDatum & { r: number }>;

    let dp = dpr();
    let width = window.innerWidth;
    let height = window.innerHeight;

    let canvas = d3
      .select(canvasNode)
      .attr("width", width * dp)
      .attr("height", height * dp);
    let context = canvasNode.getContext("2d")!;

    let blur = false;
    console.log("Q", width, height);
    let siz = Math.sqrt((width * height) / 16000000) * 5;
    const grd = siz * 20;
    nodes = d3.range(100).map(() => ({
      r: (8 + Math.random() * 2.5) * siz,
      x: Math.random() * width,
      y: Math.random() * height,
    }));
    (nodes[0] as d3.SimulationNodeDatum & { r: number }).r = 20 * siz;
    chargeRef = d3.forceManyBody().strength(0);
    d3.forceSimulation(nodes)
      .alphaDecay(0)
      .velocityDecay(0.05)
      .force("charge", chargeRef)
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((d) => (d as d3.SimulationNodeDatum & { r: number }).r + 2 * siz)
          .iterations(20)
      )
      .on("tick", () => {
        brownian();
        context.resetTransform();
        context.scale(dp, dp);
        context.fillStyle =
          blur === true
            ? white() === false
              ? "rgba(0,0,0,.1)"
              : "rgba(255,255,255,.1)"
            : white() === false
            ? "#4d4d4d"
            : "#fafafa";
        context.fillRect(0, 0, width, height);
        const lc = 1;
        context.lineWidth = lc;
        let brightness = white() ? 255 - 27 - 27 : 77 * 2 - 104;
        let dbrightness = white() ? 255 : 104;
        context.strokeStyle = "rgb(" + dbrightness + "," + dbrightness + "," + dbrightness + ")";

        for (let jg = grd / 2; jg < width + grd / 2; jg += grd) {
          let j = Math.floor(jg * dp) / dp;
          context.beginPath();
          context.moveTo(j + 0.5, grd / 2);
          context.lineTo(j + 0.5, Math.round(height / grd) * grd - grd / 2);
          context.stroke();
        }
        for (let jg = grd / 2; jg < height + grd / 2; jg += grd) {
          let j = Math.floor(jg * dp) / dp;
          context.beginPath();
          context.moveTo(grd / 2, j + 0.5);
          context.lineTo(width - grd / 2, j + 0.5);
          context.stroke();
        }
        context.strokeStyle = "rgb(" + brightness + "," + brightness + "," + brightness + ")";
        for (let jg = grd / 2; jg < width + grd / 2; jg += grd) {
          let j = Math.floor(jg * dp) / dp;
          context.beginPath();
          context.moveTo(j + 0.5 - 1, grd / 2);
          context.lineTo(j + 0.5 - 1, Math.round(height / grd) * grd - grd / 2);
          context.stroke();
        }
        for (let jg = grd / 2; jg < height + grd / 2; jg += grd) {
          let j = Math.floor(jg * dp) / dp;
          context.beginPath();
          context.moveTo(grd / 2, j + 0.5 - 1);
          context.lineTo(width - grd / 2, j + 0.5 - 1);
          context.stroke();
        }
        nodes.slice(0).forEach((dg, i) => {
          const d = dg as d3.SimulationNodeDatum & { r: number };
          if (d.x !== undefined && d.y !== undefined && d.r !== undefined) {
            let fC = i === 0 ? (white() === true ? "#4d4d4d" : "#fafafa") : d3.schemeCategory10[i % 6];
            context.fillStyle = fC;
            context.beginPath();
            context.moveTo(d.x + d.r, d.y);
            context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            context.fill();

            context.fillStyle = "rgba(255,255,255,0.45)";
            context.beginPath();
            context.moveTo(d.x + d.r, d.y);
            context.arc(d.x, d.y, d.r, 0, 2 * Math.PI);
            context.fill();

            context.lineWidth = 1;
            context.strokeStyle = "rgba(0,0,0,0.8)";
            context.beginPath();
            context.arc(d.x, d.y, d.r - 0.5, 0, 2 * Math.PI);
            context.stroke();

            context.save();
            context.beginPath();
            context.arc(d.x, d.y, d.r - 1, 0, 2 * Math.PI);
            context.clip();
            context.fillStyle = fC;
            context.beginPath();
            context.arc(d.x, d.y + 1, d.r - 1, 0, 2 * Math.PI);
            context.fill();
            context.restore();

            context.lineWidth = 1;
            context.strokeStyle = "rgba(255,255,255,0.32)";
            context.beginPath();
            context.arc(d.x, d.y, d.r - 0.5 - 1, 0, 2 * Math.PI);
            context.stroke();
          }
        });
      });
    function brownian() {
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.x !== undefined && node.y !== undefined) {
          nodes[i].x = Math.max(Math.min(node.x, width - grd / 2), grd / 2);
          nodes[i].y = Math.max(Math.min(node.y, height - grd / 2), grd / 2);
          nodes[i].x = node.x * 0.9 + (Math.round(node.x / grd + 0.5) * grd - grd / 2) * 0.1;
          nodes[i].y = node.y * 0.9 + (Math.round(node.y / grd + 0.5) * grd - grd / 2) * 0.1;
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
      let p1 = d3.pointer(event, canvas.node());
      nodes[0].fx = p1[0];
      nodes[0].fy = p1[1];
    });
    const dV = 200;
    canvas.on("mousedown", () => {
      chargeRef.strength((_, i) => (i == 0 ? sliderRef.valueAsNumber ?? dV : 0) * Math.pow(grd / 20, 2));
    });
    canvas.on("mouseup", () => {
      chargeRef.strength(0);
    });
  });

  return (
    <>
      <div
        style={{
          "background-color": white() === false ? "#4d4d4d" : "#fafafa",
          color: "black",
        }}
        class="well"
      >
        <span>Strength</span>
        <input type="range" min={-250} max={250} value={250} ref={sliderRef!} />
        <span>Theme mode</span>
        <button onClick={() => setWhite((v) => !v)}>
          {white() ? (
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
      <canvas ref={canvasNode!} />
    </>
  );
};
