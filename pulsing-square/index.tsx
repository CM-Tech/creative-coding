import sigma from "sigma";

let s,
  c,
  dom,
  backgound,
  nId = 0,
  eId = 0,
  spaceMode = false,
  nodeRadius = 10,
  mousedown = {},
  colors = ["#7eb0ea", "#fdcf51", "#ff9157"];
let blackColor = "#2f3436";
let whiteColor = "#ededeb";
let bgColor = "#dddddb";

let bgColorSpace = "#111111";
let borderThickness = 5;
let rectWidth = 25;
let turnRadius = 25;

sigma.classes.graph.addMethod("brownian", function () {
  let l = this.nodesArray.length,
    s,
    prefix = "m_";
  for (let i = 0; i < l; i++) {
    s = this.nodesArray[i];
    let rx = Math.floor(Math.random() * 3) - 1;
    let ry = Math.floor(Math.random() * 3) - 1;

    s.dX = s.x + rx * Math.floor(Math.random() * 10);
    s.dY = s.y + ry * Math.floor(Math.random() * 10);
  }
});

sigma.canvas.edges.goo = function (edge, source, target, context, settings) {
  let color = edge.color,
    prefix = settings("prefix") || "",
    edgeColor = settings("edgeColor"),
    defaultNodeColor = settings("defaultNodeColor"),
    defaultEdgeColor = settings("defaultEdgeColor");
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
  context.lineWidth = edge[prefix + "size"] || 10;
  context.globalCompositeOperation = "multiply";
  context.beginPath();
  let targetXGreater = target[prefix + "x"] > source[prefix + "x"];
  let targetYGreater = target[prefix + "y"] > source[prefix + "y"];
  let Rad = Math.min(
    turnRadius,
    Math.min(
      Math.abs(target[prefix + "x"] - source[prefix + "x"]),
      Math.abs(target[prefix + "y"] - source[prefix + "y"])
    )
  );
  context.moveTo(source[prefix + "x"], source[prefix + "y"]);
  context.lineTo(
    source[prefix + "x"],
    target[prefix + "y"] - (targetYGreater ? 1 : -1) * Rad
  );
  context.lineTo(
    source[prefix + "x"] + (targetXGreater ? 1 : -1) * Rad,
    target[prefix + "y"]
  );
  context.lineTo(target[prefix + "x"], target[prefix + "y"]);
  context.stroke();

  context.globalCompositeOperation = "source-over";
};
sigma.canvas.nodes.goo = function (node, ctx, settings) {
  let prefix = settings("prefix") || "";
  // ctx.fillStyle = node.color;
  // ctx.beginPath();
  // ctx.rect(
  //     node[prefix + 'x'] - node[prefix + 'size'] / 2,
  //     node[prefix + 'y'] - node[prefix + 'size'] / 2,
  //     node[prefix + 'size'], node[prefix + 'size']);
  // ctx.closePath();
  // ctx.fill();

  let sz = rectWidth;
  ctx.fillStyle = blackColor; //node.color;
  ctx.beginPath();
  ctx.rect(node[prefix + "x"] - sz / 2, node[prefix + "y"] - sz / 2, sz, sz);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = whiteColor;
  ctx.beginPath();
  ctx.rect(
    node[prefix + "x"] - sz / 2 + borderThickness,
    node[prefix + "y"] - sz / 2 + borderThickness,
    sz - 2 * borderThickness,
    sz - 2 * borderThickness
  );
  ctx.closePath();
  ctx.fill();
};

s = new sigma({
  renderer: {
    container: document.getElementById("graph-container"),
    type: "canvas",
  },
  settings: {
    autoRescale: false,
    mouseEnabled: true,
    touchEnabled: true,
    mouseZoomDuration: 200,
    zoomMin: 0,
    animationsTime: 1000,
  },
});
dom = document.querySelector("#graph-container canvas:last-child");
backgound = document.getElementById("backgound");
c = s.camera;

s.graph.read({
  nodes: [
    {
      id: ++nId + "",
      size: nodeRadius,
      x: 0,
      y: -80,
      dX: 0,
      dY: 0,
      type: "goo",
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      id: ++nId + "",
      size: nodeRadius,
      x: 10,
      y: -100,
      dX: 0,
      dY: 0,
      type: "goo",
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      id: ++nId + "",
      size: nodeRadius,
      x: 20,
      y: -80,
      dX: 0,
      dY: 0,
      type: "goo",
      color: colors[Math.floor(Math.random() * colors.length)],
    },
  ],
  edges: [
    {
      id: ++eId + "",
      source: "1",
      target: "2",
      type: "goo",
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      id: ++eId + "",
      source: "1",
      target: "3",
      type: "goo",
      color: colors[Math.floor(Math.random() * colors.length)],
    },
    {
      id: ++eId + "",
      source: "2",
      target: "3",
      type: "goo",
      color: colors[Math.floor(Math.random() * colors.length)],
    },
  ],
});

function frame() {
  s.refresh();
  let w = dom.offsetWidth,
    h = dom.offsetHeight;
  backgound.style.width = w;
  backgound.style.height = h;
  backgound.style.top = 0;
  backgound.style.left = 0;
  backgound.style.backgroundColor = spaceMode ? bgColorSpace : bgColor;

  requestAnimationFrame(frame);
}

frame();

dom.addEventListener(
  "mouseup",
  function (e) {
    let mx = Math.abs(mousedown.x - e.clientX),
      my = Math.abs(mousedown.y - e.clientY);
    if (Math.sqrt(Math.pow(mx, 2) + Math.pow(my, 2)) < 7) {
      let x, y, p, id, neighbors;

      x = sigma.utils.getX(e) - dom.offsetWidth / 2;
      y = sigma.utils.getY(e) - dom.offsetHeight / 2;

      p = c.cameraPosition(x, y);
      x = p.x;
      y = p.y;

      neighbors = s.graph.nodes().filter(function (n) {
        return (
          Math.sqrt(Math.pow(n.x - x, 2) + Math.pow(n.y - y, 2)) - n.size < 0
        );
      });
      if (!spaceMode)
        s.graph.addNode({
          id: (id = ++nId + ""),
          size: nodeRadius,
          x: x + Math.random() / 10,
          y: y + Math.random() / 10,
          dX: 0,
          dY: 0,
          type: "goo",
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      if (!spaceMode) {
        s.graph.addEdge({
          id: ++eId + "",
          source:
            s.graph.nodes()[Math.floor(Math.random() * s.graph.nodes().length)]
              .id,
          target: id,
          type: "goo",
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      } else {
        neighbors.forEach(function (n) {
          s.graph.dropNode(n.id);
        });
      }
    }
  },
  false
);
dom.addEventListener(
  "mousedown",
  function (e) {
    mousedown.x = e.clientX;
    mousedown.y = e.clientY;
  },
  false
);
document.addEventListener(
  "keydown",
  function (e) {
    spaceMode = e.which == 32 ? (spaceMode === true ? false : true) : spaceMode;
  },
  false
);
c.goTo({
  ratio: 0.1,
  x: 10,
  y: -90,
});
setInterval(function () {
  s.graph.brownian();
  sigma.plugins.animate(s, {
    x: "dX",
    y: "dY",
    size: "size",
  });
}, 1000);

export const PulsingSquare = () => {

};