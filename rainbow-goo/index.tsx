import { createSignal, onMount } from "solid-js";

let [radius, setRadius] = createSignal(50);
let [scale, setScale] = createSignal(1);
let [mouseX, setMouseX] = createSignal(0);
let [mouseY, setMouseY] = createSignal(0);
let [spaceMode, setSpaceMode] = createSignal(false);
let [gtop, setGtop] = createSignal("0px");
function main(dom: HTMLCanvasElement) {
  let c = { x: 0, y: 0, ratio: 1 },
    ctx = dom.getContext("2d")!,
    wheelRatio = 1.1,
    nodeRadius = 10,
    inertia = 0.8,
    springForce = 0.01,
    springLength = 50,
    maxDisplacement = 15,
    gravity = 1.5,
    colors = ["#7eb0ea", "#fdcf51", "#ff9157"];
  let blackColor = "#2f3436";

  function computePhysics() {
    for (let i = 0; i < nodes.length; i++) {
      let s = nodes[i];
      s.dX *= inertia;
      s.dY *= inertia;

      s.dY += gravity;
    }

    for (let i = 0; i < edges.length; i++) {
      let s = edges[i].source;
      let t = edges[i].target;

      let dX = s.x - t.x;
      let dY = s.y - t.y;
      let d = Math.sqrt(dX * dX + dY * dY);
      let v = (d < 2 * nodeRadius ? (2 * nodeRadius - d) / d / 2 : 0) - springForce * (d - springLength);

      t.dX -= v * dX;
      t.dY -= v * dY;
      s.dX += v * dX;
      s.dY += v * dY;
    }

    for (let i = 0; i < nodes.length; i++) {
      let s = nodes[i];
      s.dX = Math.max(Math.min(s.dX, maxDisplacement), -maxDisplacement);
      s.dY = Math.max(Math.min(s.dY, maxDisplacement), -maxDisplacement);
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

    let v,
      d,
      p1 = 5 / 6,
      p2 = 1 / 6;

    d = Math.sqrt(Math.pow(t.x - s.x, 2) + Math.pow(t.y - s.y, 2));
    v = {
      x: (t.x - s.x) / d,
      y: (t.y - s.y) / d,
    };

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
  }

  function draw_node(node: typeof nodes[number], ctx: CanvasRenderingContext2D) {
    let grd = blackColor;
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
      },
      {
        size: nodeRadius,
        x: 10,
        y: -100,
        dX: 0,
        dY: 0,
      },
      {
        size: nodeRadius,
        x: 20,
        y: -80,
        dX: 0,
        dY: 0,
      },
    ],
    edges = [
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
      let w = dom.offsetWidth,
        h = dom.offsetHeight;

      let xMin = Infinity,
        xMax = -Infinity,
        yMin = Infinity,
        yMax = -Infinity,
        margin = 50;

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
      setGtop(Math.max(h / 2 - Math.min(((yMin + yMax) / 2) * scale(), h), 0) + "px");
    }

    ctx.resetTransform();
    ctx.clearRect(0, 0, dom.width, dom.height);
    ctx.scale(1 / c.ratio, 1 / c.ratio);
    ctx.translate(-c.x, -c.y);
    for (let i = 0; i < edges.length; i++) {
      draw_edge(edges[i], edges[i].source, edges[i].target, ctx);
    }
    for (let i = 0; i < nodes.length; i++) {
      draw_node(nodes[i], ctx);
    }

    requestAnimationFrame(frame);
  }

  frame();

  dom.addEventListener("click", (e) => {
    let x = e.clientX - dom.width / 2 - c.x;
    let y = e.clientY - dom.height / 2 - c.y;

    let neighbors = nodes.filter((n) => Math.hypot(n.x - x, n.y - y) - n.size < radius());

    if (!spaceMode) {
      nodes.push({
        size: nodeRadius,
        x: x + Math.random() / 10,
        y: y + Math.random() / 10,
        dX: 0,
        dY: 0,
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
  dom.addEventListener("mousemove", (e) => {
    setMouseX(e.clientX);
    setMouseY(e.clientY);
  });

  dom.addEventListener("wheel", (e) => {
    setRadius((r) => (r * e.deltaY < 0 ? 1 / wheelRatio : wheelRatio));
  });
  document.addEventListener("keydown", (e) => {
    setSpaceMode(e.which == 32 ? (spaceMode() === true ? false : true) : spaceMode());
  });
}

export const RainbowGoo = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return (
    <div id="graph-container">
      <canvas ref={c!} width={window.innerWidth} height={window.innerHeight}></canvas>
      <div
        id="disc"
        style={{
          borderRadius: radius() * scale() + "px",
          width: 2 * radius() * scale() + "px",
          height: 2 * radius() * scale() + "px",
          top: mouseY() - radius() * scale() + "px",
          left: mouseX() - radius() * scale() + "px",
          backgroundColor: spaceMode() ? "#f99" : "#9cf",
        }}
      ></div>
      <div
        id="ground"
        style={{
          top: gtop(),
        }}
      ></div>
    </div>
  );
};
