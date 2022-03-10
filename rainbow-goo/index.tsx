import { createSignal, onMount } from "solid-js";
import { BASE_DARK, BASE_LIGHT, CYAN_MUL, MAGENTA_MUL, YELLOW_MUL } from "../shared/constants";
import { createAnimationFrame, createSizeSignal } from "../utils";

const dpr = () => window.devicePixelRatio ?? 1;

const [radius, setRadius] = createSignal(50);
const [scale, setScale] = createSignal(1);
const [mouseX, setMouseX] = createSignal(0);
const [mouseY, setMouseY] = createSignal(0);
const [spaceMode, setSpaceMode] = createSignal(false);
const [gtop, setGtop] = createSignal(0);
function main(canvas: HTMLCanvasElement) {
  const {width,height,dpr}=createSizeSignal();
  const c = { x: 0, y: 0, ratio: 1 };
  const ctx = canvas.getContext("2d")!;
  const wheelRatio = 1.001;
  const nodeRadius = 10;
  const inertia = 0.8;
  const springForce = 0.01;
  const springLength = 50;
  const maxDisplacement = 1;
  const gravity = 0.5;
  const colors = [CYAN_MUL,MAGENTA_MUL,YELLOW_MUL];
  const blackColor = "#2f3436";

  function computePhysics() {
    for (let i = 0; i < nodes.length; i++) {
      const s = nodes[i];
      s.dX *= inertia;
      s.dY *= inertia;

      s.fX = 0;
      s.fY = 0;
      s.fY += gravity;
    }

    for (let i = 0; i < edges.length; i++) {
      const s = edges[i].source;
      const t = edges[i].target;
      const dX = s.x - t.x;
      const dY = s.y - t.y;
      const d = Math.sqrt(dX * dX + dY * dY);
      const v = (d < 2 * nodeRadius ? (2 * nodeRadius - d) / d / 2 : 0)*0 - springForce * (d - springLength);

      t.fX -= v * dX;
      t.fY -= v * dY;
      s.fX += v * dX;
      s.fY += v * dY;
    }

    for (let i = 0; i < nodes.length; i++) {
      const s = nodes[i];
      s.dX += s.fX;
      s.dY += s.fY;
      const d=Math.hypot(s.dX,s.dY);
      if(d>maxDisplacement){
        s.dX =s.dX/d*maxDisplacement;
        s.dY =s.dY/d*maxDisplacement;
      }
      s.x += s.dX;
      s.y += s.dY;

      // Collision with the ground:
      s.y = Math.min(-nodeRadius, s.y);
    }
  }

  function draw_edge(
    e: typeof edges[number],
    s: typeof nodes[number],
    t: typeof nodes[number],
    ctx: CanvasRenderingContext2D
  ) {
    e.number = e.number > -1 ? e.number : Math.floor(Math.random() * 3);

    const p1 = 5 / 6;
    const p2 = 1 / 6;

    const d = Math.sqrt(Math.pow(t.x - s.x, 2) + Math.pow(t.y - s.y, 2));
    const v = {
      x: (t.x - s.x) / d,
      y: (t.y - s.y) / d,
    };
    ctx.globalCompositeOperation="multiply";
    ctx.fillStyle = colors[e.number % colors.length]; // "hsl(" + (d / t.size * 100 - 20) + ",100%,50%)";
    ctx.beginPath();
    ctx.moveTo(s.x + v.y * s.size, s.y - v.x * s.size);
    ctx.bezierCurveTo(
      s.x * p1 + t.x * p2 + v.y * e.size,
      s.y * p1 + t.y * p2 - v.x * e.size,
      t.x * p1 + s.x * p2 + v.y * e.size,
      t.y * p1 + s.y * p2 - v.x * e.size,
      t.x + v.y * t.size,
      t.y - v.x * t.size
    );
    ctx.lineTo(t.x - v.y * t.size, t.y + v.x * t.size);
    ctx.bezierCurveTo(
      t.x * p1 + s.x * p2 - v.y * e.size,
      t.y * p1 + s.y * p2 + v.x * e.size,
      s.x * p1 + t.x * p2 - v.y * e.size,
      s.y * p1 + t.y * p2 + v.x * e.size,
      s.x - v.y * s.size,
      s.y + v.x * s.size
    );
    ctx.closePath();
    ctx.fill();
    ctx.globalCompositeOperation="source-over";
  }

  function draw_node(node: typeof nodes[number], ctx: CanvasRenderingContext2D) {
    const grd = blackColor;
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.size * 0.5, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
  }

  // Initialize graph:
  let nodes = [
    {
      size: nodeRadius,
      x: 0,
      y: -80,
      dX: 0,
      dY: 0,
      fX:0,
      fY:0
    },
    {
      size: nodeRadius,
      x: 10,
      y: -100,
      dX: 0,
      dY: 0,
      fX:0,
      fY:0
    },
    {
      size: nodeRadius,
      x: 20,
      y: -80,
      dX: 0,
      dY: 0,
      fX:0,
      fY:0
    },
  ];
  let edges = [
    {
      source: nodes[0],
      target: nodes[1],
      number: -1,
      size: 0,
    },
    {
      source: nodes[0],
      target: nodes[2],
      number: -1,
      size: 0,
    },
    {
      source: nodes[1],
      target: nodes[2],
      number: -1,
      size: 0,
    },
  ];

  function frame() {
    computePhysics();

    if (nodes.length) {
      const w = canvas.width;
      const h = canvas.height;

      let xMin = Infinity;
      let xMax = -Infinity;
      let yMin = Infinity;
      let yMax = -Infinity;
      const margin = 50;

      nodes.forEach((n) => {
        xMin = Math.min(n.x, xMin);
        xMax = Math.max(n.x, xMax);
        yMin = Math.min(n.y, yMin);
        yMax = Math.max(n.y, yMax);
      });

      xMax += margin;
      xMin -= margin;
      yMax += margin;
      yMin -= margin;

      setScale(Math.min(w / Math.max(xMax - xMin, 1), h / Math.max(yMax - yMin, 1)));

      c.x = (xMin + xMax) / 2;
      c.y = (yMin + yMax) / 2;
      c.ratio = 1 / scale();
      setGtop(Math.max(h / 2 - Math.min(((yMin + yMax) / 2) * scale(), h), 0));
    }

    ctx.resetTransform();
    ctx.fillStyle=BASE_LIGHT;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.scale(1 / c.ratio, 1 / c.ratio);
    ctx.translate(-c.x, -c.y);

    ctx.strokeStyle = spaceMode() ? "#f99" : "#9cf";
    ctx.lineWidth=c.ratio*8*dpr();
    const x = (mouseX() - canvas.width / 2) * c.ratio + c.x;
    const y = (mouseY() - canvas.height / 2) * c.ratio + c.y;
    ctx.beginPath();
    ctx.arc(x, y, radius() * scale() * c.ratio, 0, 2 * Math.PI);
    ctx.stroke();

    for (let i = 0; i < edges.length; i++) {
      draw_edge(edges[i], edges[i].source, edges[i].target, ctx);
    }
    for (let i = 0; i < nodes.length; i++) {
      draw_node(nodes[i], ctx);
    }
    ctx.resetTransform();
    ctx.fillStyle = BASE_DARK;
    ctx.fillRect(0, gtop(), canvas.width, canvas.height);
  }

  createAnimationFrame(frame);

  canvas.addEventListener("click", () => {
    const x = (mouseX() - canvas.width / 2) * c.ratio + c.x;
    const y = (mouseY() - canvas.height / 2) * c.ratio + c.y;
    const neighbors = nodes.filter((n) => Math.hypot(n.x - x, n.y - y) - n.size < radius());

    if (!spaceMode()) {
      nodes.push({
        size: nodeRadius,
        x: x + Math.random() / 10,
        y: y + Math.random() / 10,
        dX: 0,
        dY: 0,
        fX:0,
        fY:0
      });
      neighbors.forEach((n) => {
        edges.push({
          source: nodes[nodes.length - 1],
          target: n,
          number: -1,
          size: 0,
        });
      });
    } else {
      nodes = nodes.filter((x) => !neighbors.includes(x));
      edges = edges.filter((x) => !neighbors.includes(x.source) && !neighbors.includes(x.target));
    }
  });
  canvas.addEventListener("mousemove", (e) => {
    setMouseX(e.clientX * dpr());
    setMouseY(e.clientY * dpr());
  });

  canvas.addEventListener("wheel", (e) => {
    setRadius((r) => r * Math.pow(wheelRatio, e.deltaY));
  });
  document.addEventListener("keydown", (e) => {
    setSpaceMode(e.which == 32 ? (spaceMode() ? false : true) : spaceMode());
  });
}

export const RainbowGoo = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return (
    <>
      <canvas
        ref={c!}
        style={{ width: "100%", height: "100%" }}
        width={window.innerWidth * dpr()}
        height={window.innerHeight * dpr()}
      />
    </>
  );
};
