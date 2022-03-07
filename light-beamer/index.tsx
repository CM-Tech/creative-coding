import chroma from "chroma-js";
import { onMount } from "solid-js";
import { BASE_DARK } from "../shared/constants";
import { createAnimationFrame, createSizeSignal } from "../utils";

const main = (c: HTMLCanvasElement) => {

  let w = window.innerWidth * (window.devicePixelRatio ?? 1);
  let h = window.innerHeight * (window.devicePixelRatio ?? 1);
  c.width = w;
  c.height = h;
  window.addEventListener("resize", () => {
    w = window.innerWidth * (window.devicePixelRatio ?? 1);
    h = window.innerHeight * (window.devicePixelRatio ?? 1);

    c.width = w;
    c.height = h;
  });
  const ctx = c.getContext("2d")!;
  let mouseX = 0;
  let mouseY = 0;
  const mirrors: Line[] = [];
  let mirrorsSize = 0;
  let startX = null as number | null;
  let startY = null as number | null;
  let startColor = "white";
  function getCoords(event: MouseEvent) {
    mouseX = event.clientX * (window.devicePixelRatio ?? 1);
    mouseY = event.clientY * (window.devicePixelRatio ?? 1);
  }

  class Line {
    x: number;
    y: number;
    ex: number;
    ey: number;
    len: number;
    color: string;
    constructor(x: number, y: number, ex: number, ey: number, color = "white") {
      this.x = x;
      this.y = y;
      this.ex = ex;
      this.ey = ey;
      this.len = Math.sqrt((this.x - this.ex) * (this.x - this.ex) + (this.y - this.ey) * (this.y - this.ey));
      this.color = color;
    }
  }
  function dotLines(a: Line, b: Line) {
    return (a.ex - a.x) * (b.ex - b.x) + (a.ey - a.y) * (b.ey - b.y);
  }
  class Point {
    x: number;
    y: number;
    len: number;
    constructor(x: number, y: number) {
      this.x = x;
      this.y = y;

      this.len = Math.sqrt((this.x - 0) * (this.x - 0) + (this.y - 0) * (this.y - 0));
    }
  }
  function inside(point: [number, number], vs: [number, number][]) {
    // ray-casting algorithm based on
    // https://wrf.ecse.rpi.edu/Research/Short_Notes/pnpoly.html/pnpoly.html

    const x = point[0];
    const y = point[1];

    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      const xi = vs[i][0];
      const yi = vs[i][1];
      const xj = vs[j][0];
      const yj = vs[j][1];

      const intersect = yi > y != yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }

    return inside;
  }
  class LineProjection {
    origin: SimplePoint;
    horizon: Line;
    hFar: boolean;
    nearClip: Line;
    linesLeft: Line[];
    allLines: Line[];
    boxLines: Line[];
    children: LineProjection[];
    nearMirror: Line | null;
    color: string;
    constructor(
      origin: SimplePoint,
      horizon: Line,
      hFar: boolean,
      nearClip: Line,
      linesLeft: Line[],
      allLines: Line[],
      color = "white"
    ) {
      this.origin = origin;
      this.horizon = horizon;
      this.hFar = hFar;
      this.nearClip = nearClip;
      this.linesLeft = linesLeft;
      this.allLines = allLines;
      this.children = [];
      this.boxLines = [
        new Line(this.nearClip.x, this.nearClip.y, this.horizon.x, this.horizon.y),
        this.horizon,
        this.nearClip,
        new Line(this.nearClip.ex, this.nearClip.ey, this.horizon.ex, this.horizon.ey),
      ];
      this.nearMirror = null;
      this.color = color;
    }
    calc(depth: number) {
      this.children = [];
      if (this.linesLeft.length > 0) {
        const splitter = this.linesLeft[0];
        const restLines = this.linesLeft.slice(1);
        if (!this.lineInCone(splitter)) {
          const l = new LineProjection(this.origin, this.horizon, this.hFar, this.nearClip, restLines, this.allLines, this.color);
          if (this.nearMirror !== null) {
            l.nearMirror = this.nearMirror;
          }
          this.children.push(l);
        } else {
          let lineToTest = splitter;
          if (dotLines(this.horizon, lineToTest) < 0) {
            lineToTest = new Line(splitter.ex, splitter.ey, splitter.x, splitter.y);
          }
          const AIN = this.pointInCone(new Point(lineToTest.x, lineToTest.y));
          const BIN = this.pointInCone(new Point(lineToTest.ex, lineToTest.ey));

          const inters: SimplePoint[] = this.boxLines
            .map((x) => lineIntersect(x, lineToTest))
            .filter((x) => x.onLine1 && x.onLine2);
          const pts = inters.concat([]);

          if (AIN) pts.push(new Point(lineToTest.x, lineToTest.y));
          if (BIN) pts.push(new Point(lineToTest.ex, lineToTest.ey));

          const ogPoints = pts.slice();
          const LI = lineIntersect(this.boxLines[0], lineToTest);
          const RI = lineIntersect(this.boxLines[3], lineToTest);
          if (!(LI.onLine1 && LI.onLine2)) {
            if (dotLines(new Line(this.origin.x, this.origin.y, LI.x, LI.y), this.boxLines[0]) > 0) {
              pts.push(LI);
            } else {
              pts.push(new Point(this.horizon.x, this.horizon.y));
            }
          }

          if (!(RI.onLine1 && RI.onLine2)) {
            if (dotLines(new Line(this.origin.x, this.origin.y, RI.x, RI.y), this.boxLines[3]) > 0) {
              pts.push(RI);
            } else {
              pts.push(new Point(this.horizon.ex, this.horizon.ey));
            }
          }
          const leftAtan = Math.atan2(this.horizon.y - this.origin.y, this.horizon.x - this.origin.x);
          const q = pts.map(
            (x) =>
              [
                x,
                (((Math.atan2(x.y - this.origin.y, x.x - this.origin.x) - leftAtan) % (Math.PI * 2)) + Math.PI * 2) %
                (Math.PI * 2),
              ] as const
          );
          q.sort((a, b) => a[1] - b[1]);
          const pts2 = q.map((x) => x[0]);

          for (let o = 0; o < pts2.length - 1; o++) {
            const leftPt = pts2[o];
            const rightPt = pts2[o + 1];
            const lineC = new Line(leftPt.x, leftPt.y, rightPt.x, rightPt.y);
            let newNC = this.nearClip;
            if (newNC.len > 0) {
              const newNCLeft = lineIntersect(newNC, new Line(this.origin.x, this.origin.y, leftPt.x, leftPt.y));
              const newNCRight = lineIntersect(newNC, new Line(this.origin.x, this.origin.y, rightPt.x, rightPt.y));

              newNC = new Line(newNCLeft.x, newNCLeft.y, newNCRight.x, newNCRight.y);
            }
            let newFC = this.horizon;
            if (newFC.len > 0) {
              const newFCLeft = lineIntersect(newFC, new Line(this.origin.x, this.origin.y, leftPt.x, leftPt.y));
              const newFCRight = lineIntersect(newFC, new Line(this.origin.x, this.origin.y, rightPt.x, rightPt.y));

              newFC = new Line(newFCLeft.x, newFCLeft.y, newFCRight.x, newFCRight.y);
            }
            let hitLine = false;
            hitLine = true;
            if (!ogPoints.includes(rightPt)) {
              hitLine = false;
            }
            if (!ogPoints.includes(leftPt)) {
              hitLine = false;
            }
            if (hitLine) {
              newFC = lineC;
            }
            const l = new LineProjection(this.origin, newFC, this.hFar && !hitLine, newNC, restLines, this.allLines, this.color);
            if (this.nearMirror !== null) {
              l.nearMirror = this.nearMirror;
            }
            if (hitLine) {
              l.nearMirror = splitter;
            }
            this.children.push(l);
          }
        }
        if (this.children.length > 0) {
          this.children.forEach((x) => {
            x.calc(depth);
          });
        }
      } else if (!this.hFar && depth > 0) {
        const reflectionLine = this.horizon;
        const newNC = new Line(reflectionLine.ex, reflectionLine.ey, reflectionLine.x, reflectionLine.y);
        const newOrigin = reflectOverLine(this.origin.x, this.origin.y, reflectionLine);

        const newAllLines = this.allLines;

        const nearNear = lineIntersect(
          newNC,
          new Line(newOrigin.x, newOrigin.y, newOrigin.x - (newNC.ey - newNC.y), newOrigin.y + (newNC.ex - newNC.x))
        );
        const d = new Line(newOrigin.x, newOrigin.y, nearNear.x, nearNear.y).len;
        const S = 1 + Math.sqrt(w * w + h * h) / d;
        const newFC = new Line(
          (newNC.x - newOrigin.x) * S + newOrigin.x,
          (newNC.y - newOrigin.y) * S + newOrigin.y,
          (newNC.ex - newOrigin.x) * S + newOrigin.x,
          (newNC.ey - newOrigin.y) * S + newOrigin.y
        );
        const l = new LineProjection(
          newOrigin,
          newFC,
          true,
          newNC,
          newAllLines.filter((x) => x !== this.nearMirror),
          newAllLines,
          chroma.blend(this.color, this.nearMirror?.color ?? "#ffffff", "multiply").hex()
        );
        this.children.push(l);
        if (this.children.length > 0) {
          this.children.forEach((x) => {
            x.calc(depth - 1);
          });
        }
      }
    }
    draw(ctx: CanvasRenderingContext2D) {
      if (this.linesLeft.length > 0) {
        this.children.forEach((x) => {
          x.draw(ctx);
        });
      } else {
        ctx.beginPath();
        ctx.moveTo(this.nearClip.x, this.nearClip.y);
        ctx.lineTo(this.nearClip.ex, this.nearClip.ey);
        ctx.lineTo(this.horizon.ex, this.horizon.ey);

        ctx.lineTo(this.horizon.x, this.horizon.y);
        ctx.closePath();

        const range = 10000;
        const gradient = ctx.createRadialGradient(this.origin.x, this.origin.y, 0, this.origin.x, this.origin.y, range);
        const slices = 10;
        for (let i = 0; i < slices; i++) {
          const r = (range / slices) * i;
          const b = 100 / (r + 1);
          gradient.addColorStop(r / range, chroma(this.color).mix(chroma("black"), Math.min(Math.max(1 - b, 0), 1)).hex());
        }
        ctx.globalCompositeOperation = "lighter";
        ctx.fillStyle = gradient;
        ctx.fill();

        this.children.forEach((x) => {
          x.draw(ctx);
        });
      }
    }
    pointInCone(pointToTest: SimplePoint) {
      return inside(
        [pointToTest.x, pointToTest.y],
        [
          [this.nearClip.x, this.nearClip.y],
          [this.nearClip.ex, this.nearClip.ey],
          [this.horizon.ex, this.horizon.ey],
          [this.horizon.x, this.horizon.y],
        ]
      );
    }
    lineInCone(lineToTest: Line) {
      if (lineToTest.len === 0) {
        return false;
      }
      if (
        this.pointInCone(new Point(lineToTest.x, lineToTest.y)) ||
        this.pointInCone(new Point(lineToTest.ex, lineToTest.ey))
      ) {
        return true;
      }
      if (
        this.boxLines
          .map((x) => lineIntersect(x, lineToTest))
          .map((x) => x.onLine1 && x.onLine2)
          .find((x) => x)
      ) {
        return true;
      }
      return false;
    }
  }
  document.body.addEventListener("mousemove", getCoords);
  document.body.addEventListener("mousedown", () => {
    if (startX == null) {
      startColor = ["cyan", "magenta", "yellow", "white"][Math.floor(Math.random() * 4)];
      mirrors[mirrorsSize++] = new Line(mouseX, mouseY, mouseX, mouseY, startColor);
      startX = mouseX;
      startY = mouseY;
    } else {
      startX = null;
      startY = null;
    }
  });

  createAnimationFrame(tick);

  function drawMirror(line: Line) {
    ctx.strokeStyle = line.color;
    ctx.lineWidth = 4;
    ctx.setLineDash([2, 2]);
    ctx.beginPath();
    ctx.moveTo(line.x, line.y);
    ctx.lineTo(line.ex, line.ey);
    ctx.stroke();
  }
  function tick() {
    ctx.globalCompositeOperation = "source-over";

    ctx.globalAlpha = 1;
    ctx.fillStyle = BASE_DARK;

    ctx.fillRect(0, 0, w, h);

    if (startX !== null && startY !== null) {
      mirrors[mirrors.length - 1] = new Line(startX, startY, mouseX, mouseY, startColor);
    }

    const topHorizon = new Line(0, 0, w, 0);
    const origin = new Point(w / 2.0, h / 2.0);
    const originClip = new Line(w / 2.0, h / 2.0, w / 2.0, h / 2.0);
    const cl = 20;
    const proj1 = new LineProjection(origin, topHorizon, true, originClip, mirrors.slice(), mirrors.slice());
    proj1.calc(cl);
    proj1.draw(ctx);
    const proj2 = new LineProjection(origin, new Line(w, 0, w, h), true, originClip, mirrors.slice(), mirrors.slice());
    proj2.calc(cl);
    proj2.draw(ctx);
    const proj3 = new LineProjection(origin, new Line(w, h, 0, h), true, originClip, mirrors.slice(), mirrors.slice());
    proj3.calc(cl);
    proj3.draw(ctx);
    const proj4 = new LineProjection(origin, new Line(0, h, 0, 0), true, originClip, mirrors.slice(), mirrors.slice());
    proj4.calc(cl);
    proj4.draw(ctx);

    for (let l = 0; l < mirrors.length; l++) {
      drawMirror(mirrors[l]);
    }
  }

  function reflectOverLine(x: number, y: number, line: Line) {
    return reflectBad(
      {
        x: x,
        y: y,
      },
      {
        x: line.x,
        y: line.y,
      },
      {
        x: line.ex,
        y: line.ey,
      }
    );
  }

  interface SimplePoint {
    x: number;
    y: number;
  }
  function reflectBad(p: SimplePoint, p0: SimplePoint, p1: SimplePoint) {
    const dx = p1.x - p0.x;
    const dy = p1.y - p0.y;
    const a = (dx * dx - dy * dy) / (dx * dx + dy * dy);
    const b = (2 * dx * dy) / (dx * dx + dy * dy);
    const x = Math.round(a * (p.x - p0.x) + b * (p.y - p0.y) + p0.x);
    const y = Math.round(b * (p.x - p0.x) - a * (p.y - p0.y) + p0.y);

    return {
      x: x,
      y: y,
    };
  }

  function lineIntersect(line1: Line, line2: Line) {
    return checkLineIntersection(line1.x, line1.y, line1.ex, line1.ey, line2.x, line2.y, line2.ex, line2.ey);
  }

  function checkLineIntersection(
    line1StartX: number,
    line1StartY: number,
    line1EndX: number,
    line1EndY: number,
    line2StartX: number,
    line2StartY: number,
    line2EndX: number,
    line2EndY: number
  ) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    const result = {
      x: 0,
      y: 0,
      onLine1: false,
      onLine2: false,
    };
    const denominator =
      (line2EndY - line2StartY) * (line1EndX - line1StartX) - (line2EndX - line2StartX) * (line1EndY - line1StartY);
    if (denominator == 0) {
      return result;
    }
    let a = line1StartY - line2StartY;
    let b = line1StartX - line2StartX;
    const numerator1 = (line2EndX - line2StartX) * a - (line2EndY - line2StartY) * b;
    const numerator2 = (line1EndX - line1StartX) * a - (line1EndY - line1StartY) * b;
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + a * (line1EndX - line1StartX);
    result.y = line1StartY + a * (line1EndY - line1StartY);
    /*
    // it is worth noting that this should be the same as:
    x = line2StartX + (b * (line2EndX - line2StartX));
    y = line2StartX + (b * (line2EndY - line2StartY));
    */
    // if line1 is a segment and line2 is infinite, they intersect if:
    if (a > 0 && a < 1) {
      result.onLine1 = true;
    }
    // if line2 is a segment and line1 is infinite, they intersect if:
    if (b > 0 && b < 1) {
      result.onLine2 = true;
    }
    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
  }
};

export const LightBeamer = () => {
  let c: HTMLCanvasElement;
  const { width, height, dpr } = createSizeSignal();
  onMount(() => {
    main(c);
  });
  return <canvas ref={c!} width={width() * dpr()} height={height() * dpr()} style={{ width: "100%", height: "100%" }} />;
};
