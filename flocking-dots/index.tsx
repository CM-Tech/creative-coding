import * as d3 from "d3";
import type { QuadtreeInternalNode, QuadtreeLeaf } from "d3";
import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

const draw = (svge: SVGSVGElement) => {
  let w = window.innerWidth;
  let h = window.innerHeight;
  const baseRad = Math.max(Math.min(w, h) / 200, 4);
  const nodes = d3.range((w * h) / baseRad / 500).map(() => {
    return {
      radius: baseRad,
      vx: Math.random() * 12 - 6,
      vy: Math.random() * 12 - 6,
      x: Math.random() * w,
      y: Math.random() * h,
      ax: 0,
      ay: 0,
      fixed: false,
      fx: 0,
      fy: 0,
      aveCenterX: 0,
      aveCenterY: 0,
      aveVX: 0,
      aveVY: 0,
      totalNebs: 0,
      px: 0,
      py: 0,
    };
  });
  for (let i = 1; i < nodes.length; i++) {
    nodes[i].ax = nodes[i].x;
    nodes[i].ay = nodes[i].y;
  }

  const root = nodes[0];
  root.radius = 0;
  root.fixed = true;

  const svg = d3.select(svge).attr("width", w).attr("height", h);

  svg
    .selectAll("circle")
    .data(nodes.slice(1))
    .enter()
    .append("svg:circle")
    .attr("r", (d) => {
      return d.radius - 2;
    })
    .style("fill", "transparent");

  function draw() {
    const q = d3.quadtree(nodes);
    let i = 0;
    const n = nodes.length;
    for (i = 1; i < n; i++) {
      nodes[i].fx = 0;
      nodes[i].fy = 0;
      nodes[i].aveCenterX = 0;
      nodes[i].aveCenterY = 0;
      nodes[i].aveVX = 0;
      nodes[i].aveVY = 0;
      nodes[i].totalNebs = 0;
    }
    i = 0;
    while (++i < n) {
      q.visit(collide(nodes[i]));
    }
    for (i = 1; i < n; i++) {
      nodes[i].fx += nodes[i].vx / 4;
      nodes[i].fy += nodes[i].vy / 4;
      if (nodes[i].totalNebs > 0) {
        nodes[i].fx += nodes[i].aveVX / nodes[i].totalNebs;
        nodes[i].fy += nodes[i].aveVY / nodes[i].totalNebs;
        nodes[i].fx += (nodes[i].aveCenterX / nodes[i].totalNebs - nodes[i].x) / 40;
        nodes[i].fy += (nodes[i].aveCenterY / nodes[i].totalNebs - nodes[i].y) / 40;
      }
      let fL = Math.sqrt(nodes[i].fx * nodes[i].fx + nodes[i].fy * nodes[i].fy);
      if (fL === 0) {
        fL = 1;
        const randDir = Math.random() * Math.PI * 2;

        nodes[i].fx = Math.cos(randDir) * 1;
        nodes[i].fy = Math.sin(randDir) * 1;
      }
      const min = nodes[i].radius / 5;
      const max = nodes[i].radius * 1;
      nodes[i].vx = (nodes[i].fx / fL) * Math.min(Math.max(min, fL), max);
      nodes[i].vy = (nodes[i].fy / fL) * Math.min(Math.max(min, fL), max);
      nodes[i].x += nodes[i].vx;
      nodes[i].y += nodes[i].vy;
      bound(nodes[i]);
      nodes[i].x += nodes[i].vx;
      nodes[i].y += nodes[i].vy;
      nodes[i].ax += (nodes[i].x - nodes[i].ax) * 0.1;
      nodes[i].ay += (nodes[i].y - nodes[i].ay) * 0.1;
    }
    svg
      .selectAll("circle")
      .attr("cx", (d) => {
        return (d as Node).ax;
      })
      .attr("cy", (d) => {
        return (d as Node).ay;
      });
  }
  createAnimationFrame(draw);

  svg.on("mousemove", (e) => {
    const p1 = d3.pointer(e);
    root.px = p1[0];
    root.py = p1[1];
  });

  function bound(node: Node) {
    const r = node.radius;
    let nx = Math.max(node.x, r);
    let ny = Math.max(node.y, r);
    nx = Math.min(nx, w - r);
    ny = Math.min(ny, h - r);

    node.vx += nx - node.x;
    node.vy += ny - node.y;
    node.vx += nx - node.x;
    node.vy += ny - node.y;
  }

  type Node = typeof nodes[number];
  function collide(node: Node) {
    const r = node.radius * 3;
    const nx1 = node.x - r;
    const nx2 = node.x + r;
    const ny1 = node.y - r;
    const ny2 = node.y + r;
    return (n2: QuadtreeInternalNode<Node> | QuadtreeLeaf<Node>, x1: number, y1: number, x2: number, y2: number) => {
      if (!n2.length) {
        do {
          if (n2.data !== node) {
            let x = node.x - n2.data.x;
            let y = node.y - n2.data.y;
            let l = Math.sqrt(x * x + y * y);
            let r = node.radius + n2.data.radius;
            if (l < r * 3) {
              node.totalNebs++;
              n2.data.totalNebs++;
              node.aveVX += n2.data.vx;
              n2.data.aveVX += node.vx;
              node.aveVY += n2.data.vy;
              n2.data.aveVY += node.vy;
              node.aveCenterX += n2.data.x;
              n2.data.aveCenterX += node.x;
              node.aveCenterY += n2.data.y;
              n2.data.aveCenterY += node.y;
              r = r * 1.5;
              if (l < r) {
                l = ((l - r) / l) * 0.5;
                node.fx -= x *= l;
                node.fy -= y *= l;
                n2.data.fx += x;
                n2.data.fy += y;
              }
            }
          }
        } while ((n2 = n2.next!) && n2);
      }
      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  }
  window.onresize = () => {
    w = window.innerWidth;
    h = window.innerHeight;
    svg.attr("width", w).attr("height", h);
  };
};

export const FlockingDots = () => {
  let svg: SVGSVGElement;
  onMount(() => {
    draw(svg);
  });
  return (
    <>
      <svg ref={svg!} width={window.innerWidth} height={window.innerHeight} class="flocking"></svg>
    </>
  );
};
