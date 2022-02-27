import { onMount } from "solid-js";

function main(dom: HTMLCanvasElement) {
  let ctx = dom.getContext("2d")!,
    spaceMode = false,
    nodeRadius = 10,
    mousedown = { x: 0, y: 0 },
    colors = ["#7eb0ea", "#fdcf51", "#ff9157"];
  let blackColor = "#2f3436";
  let whiteColor = "#ededeb";
  let bgColor = "#dddddb";

  let bgColorSpace = "#111111";
  let borderThickness = 5;
  let rectWidth = 25;
  let turnRadius = 25;
  let c = {
    x: 0,
    y: 0,
  };
  let lasttime = Date.now();

  function brownian() {
    lasttime = Date.now();
    let l = nodes.length;
    for (let i = 0; i < l; i++) {
      let s = nodes[i];

      s.truex += s.dx;
      s.truey += s.dy;
      s.dx = Math.random() * 80 - 40;
      s.dy = Math.random() * 80 - 40;
    }
  }

  function draw_edge(
    edge: typeof edges[number],
    source: typeof nodes[number],
    target: typeof nodes[number],
    context: CanvasRenderingContext2D,
    settings: (x: string) => string | undefined
  ) {
    let color = edge.color,
      edgeColor = settings("edgeColor"),
      defaultNodeColor = settings("defaultNodeColor")!,
      defaultEdgeColor = settings("defaultEdgeColor")!;
    if (!color)
      switch (edgeColor) {
        case "source":
          color = source.color || defaultNodeColor;
          break;
        case "target":
          color = target.color || defaultNodeColor;
          break;
        default:
          color = defaultEdgeColor;
          break;
      }
    context.strokeStyle = color;
    context.lineWidth = 10;
    context.globalCompositeOperation = "multiply";
    context.beginPath();
    let targetXGreater = target.x > source.x;
    let targetYGreater = target.y > source.y;
    let Rad = Math.min(turnRadius, Math.min(Math.abs(target.x - source.x), Math.abs(target.y - source.y)));
    context.moveTo(source.x, source.y);
    context.lineTo(source.x, target.y - (targetYGreater ? 1 : -1) * Rad);
    context.lineTo(source.x + (targetXGreater ? 1 : -1) * Rad, target.y);
    context.lineTo(target.x, target.y);
    context.stroke();

    context.globalCompositeOperation = "source-over";
  }

  function draw_node(node: typeof nodes[number], ctx: CanvasRenderingContext2D) {
    let sz = rectWidth;
    ctx.fillStyle = blackColor; //node.color;
    ctx.beginPath();
    ctx.rect(node.x - sz / 2, node.y - sz / 2, sz, sz);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = whiteColor;
    ctx.beginPath();
    ctx.rect(
      node.x - sz / 2 + borderThickness,
      node.y - sz / 2 + borderThickness,
      sz - 2 * borderThickness,
      sz - 2 * borderThickness
    );
    ctx.closePath();
    ctx.fill();
  }

  let nodes = [
    {
      size: nodeRadius,
      truex: -100,
      truey: -50,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      size: nodeRadius,
      truex: 100,
      truey: 50,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      size: nodeRadius,
      truex: 0,
      truey: -100,
      x: 0,
      y: 0,
      dx: 0,
      dy: 0,
      color: colors[Math.floor(Math.random() * colors.length)],
    },
  ];

  let edges = [
    {
      source: nodes[0],
      target: nodes[1],
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      source: nodes[0],
      target: nodes[2],
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      source: nodes[1],
      target: nodes[2],
      color: colors[Math.floor(Math.random() * colors.length)],
    },
  ];

  let dragging = false;
  dom.addEventListener("mouseup", (e) => {
    dragging = false;
    lastAdd.x = 0;
    lastAdd.y = 0;
    if (Math.hypot(mousedown.x - e.clientX, mousedown.y - e.clientY) < 7) {
      let x = e.clientX - dom.width / 2 - c.x;
      let y = e.clientY - dom.height / 2 - c.y;

      let neighbors = nodes.filter((n) => Math.hypot(n.x - x, n.y - y, 2) < n.size);
      if (!spaceMode) {
        nodes.push({
          size: nodeRadius,
          truex: x + Math.random() / 10,
          truey: y + Math.random() / 10,
          x: 0,
          y: 0,
          dx: 0,
          dy: 0,
          color: colors[Math.floor(Math.random() * colors.length)],
        });

        edges.push({
          source: nodes[Math.floor(Math.random() * nodes.length)],
          target: nodes[nodes.length - 1],
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      } else {
        nodes = nodes.filter((x) => !neighbors.includes(x));
        edges = edges.filter((x) => !neighbors.includes(x.source) && !neighbors.includes(x.target));
      }
    }
  });

  dom.addEventListener("mousedown", (e) => {
    mousedown.x = e.clientX;
    mousedown.y = e.clientY;
    dragging = true;
  });
  let lastAdd = {
    x: 0,
    y: 0,
  };
  dom.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    let mx = e.clientX - mousedown.x;
    let my = e.clientY - mousedown.y;
    if (Math.hypot(mx, my) < 7) {
      mx = 0;
      my = 0;
    }
    c.x += mx - lastAdd.x;
    c.y += my - lastAdd.y;
    lastAdd.x = mx;
    lastAdd.y = my;
  });
  document.addEventListener("keydown", (e) => {
    spaceMode = e.which == 32 ? (spaceMode === true ? false : true) : spaceMode;
  });

  function quad(k: number) {
    if ((k *= 2) < 1) return 0.5 * k * k;
    return -0.5 * (--k * (k - 2) - 1);
  }
  function animate() {
    let p = (Date.now() - lasttime) / 1000;
    for (let i = 0; i < nodes.length; i++) {
      nodes[i].x = nodes[i].truex + nodes[i].dx * quad(p);
      nodes[i].y = nodes[i].truey + nodes[i].dy * quad(p);
    }

    dom.style.backgroundColor = spaceMode ? bgColorSpace : bgColor;

    ctx.resetTransform();
    ctx.clearRect(0, 0, dom.width, dom.height);
    ctx.translate(c.x + dom.width / 2, c.y + dom.height / 2);

    for (let i = 0; i < edges.length; i++) {
      draw_edge(edges[i], edges[i].source, edges[i].target, ctx, () => undefined);
    }
    for (let i = 0; i < nodes.length; i++) {
      draw_node(nodes[i], ctx);
    }

    requestAnimationFrame(animate);
  }
  animate();

  setInterval(brownian, 1000);
}

export const PulsingSquare = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return <canvas ref={c!} width={window.innerWidth} height={window.innerHeight} />;
};
