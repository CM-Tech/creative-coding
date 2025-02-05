import { Delaunay } from "d3";
import { createEffect, createSignal, onMount } from "solid-js";
import { createAnimationFrame, createSizeSignal } from "../utils";

// Credit to Liam (Stack Overflow)
// https://stackoverflow.com/a/41034697/3480193
class Cursor {
  static getCurrentCursorPosition(parentElement) {
    const selection = window.getSelection();
    let charCount = -1;
    let node;

    if (selection.focusNode) {
      if (Cursor._isChildOf(selection.focusNode, parentElement)) {
        node = selection.focusNode;
        charCount = selection.focusOffset;

        while (node) {
          if (node === parentElement) {
            break;
          }

          if (node.previousSibling) {
            node = node.previousSibling;
            charCount += (node.textContent ?? "").length;
          } else {
            node = node.parentNode;
            if (node === null) {
              break;
            }
          }
        }
      }
    }

    return charCount;
  }

  static setCurrentCursorPosition(chars, element) {
    if (chars >= 0) {
      const selection = window.getSelection();

      const range = Cursor._createRange(element, { count: chars });

      if (range) {
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  }

  static _createRange(node, chars, range) {
    if (!range) {
      range = document.createRange();
      range.selectNode(node);
      range.setStart(node, 0);
    }

    if (chars.count === 0) {
      range.setEnd(node, chars.count);
    } else if (node && chars.count > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.length < chars.count) {
          chars.count -= node.textContent.length;
        } else {
          range.setEnd(node, chars.count);
          chars.count = 0;
        }
      } else {
        for (let lp = 0; lp < node.childNodes.length; lp++) {
          range = Cursor._createRange(node.childNodes[lp], chars, range);

          if (chars.count === 0) {
            break;
          }
        }
      }
    }

    return range;
  }

  static _isChildOf(node, parentElement) {
    while (node !== null) {
      if (node === parentElement) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }
}

const main = (
  textField: HTMLDivElement,
  ctx: CanvasRenderingContext2D,
  setRText: (v: { x: number; y: number; fontSize: number; text: string }[]) => void
) => {
  let hsize = 1;
  let speed = 1;
  const { width: windowWidth, height: windowHeight, dpr } = createSizeSignal();
  const size = {
    x: window.innerWidth,
    y: window.innerHeight,
  };
  const gt = () => {
    const c = [...textField.childNodes].map((x) => x.textContent).join("\n");
    return c; //.substring(0,c.length-1);
  };

  function textChanged(event: Event | KeyboardEvent) {
    // if ((event as KeyboardEvent).keyCode == 13) {
    //   // event.preventDefault();
    // } else {
    // const vg=window.getSelection()?.getRangeAt(0);
    // let m=vg?.startContainer.
    // let [m,mm]=getCaretPosition(textField);
    const v = gt();
    // textField.innerText="";
    setText(v);
    // }
  }
  function textChanged2(event: Event | KeyboardEvent) {
    if ((event as KeyboardEvent).keyCode == 13) {
      // event.preventDefault()
      // Cursor.setCurrentCursorPosition(Cursor.getCurrentCursorPosition(textField)+1,textField);
    }
  }
  // textField.addEventListener("change", textChanged);
  textField.addEventListener("input", textChanged);
  textField.addEventListener("keydown", textChanged2);

  class Particle {
    a: number;
    b: number;
    c: number;
    d: number;
    f: number;
    g: string;
    j: number;
    x: number;
    speed: number;
    y: number;
    constructor(i: number) {
      const g = (i / 4) % size.x;
      const t = Math.floor(i / 4 / size.x);
      this.x = random(1) * speed;
      this.y = random(1) * speed;
      this.j = g;
      this.speed = t;
      this.a = random() * hsize;
      this.b = random() * hsize;
      this.f = 2 + random(1) * hsize; //put a 1 inside random for upside down hearts
      this.d = 0.05;
      this.g = "#f77";
      this.c = hsize + random(1) * hsize;
    }
    heart() {
      const he = this.f;
      const wi = this.f;
      const x = this.x;
      const y = this.y;
      ctx.fillStyle = this.g;
      ctx.beginPath();
      ctx.moveTo(x + 0.5 * wi, y + 0.3 * he);
      ctx.bezierCurveTo(x + 0.1 * wi, y, x, y + 0.6 * he, x + 0.5 * wi, y + 0.9 * he);
      ctx.bezierCurveTo(x + 1 * wi, y + 0.6 * he, x + 0.9 * wi, y, x + 0.5 * wi, y + 0.3 * he);
      ctx.closePath();
      ctx.fill();
    }
    h() {
      const x = this.x;
      const y = this.y;
      const b = this.c;
      const l = this.j;
      hsize = this.speed;
      x < l - this.c && ((this.x = l - b), (this.a *= -1));
      x > l + this.c && ((this.x = l + b), (this.a *= -1));
      y < hsize - b && ((this.y = hsize - b), (this.b *= -1));
      y > hsize + b && ((this.y = hsize + b), (this.b *= -1));
    }
    tick() {
      // this.a > n && (this.heart.a = n);
      // this.b > n && (this.heart.b = n);
      this.x += this.a * this.d;
      this.y += this.b * this.d;
      this.h();
    }
  }

  function background() {
    ctx.fillStyle = BASE_DARK;
    ctx.fillRect(0, 0, size.x, size.y);
  }

  function random(neg?: number) {
    const rand = Math.random();
    return neg ? 2 * rand - 1 : rand;
  }

  let s = 0;
  let pa: Particle[] = [];
  let t = "EDIT\nME!";
  if (window.location.hash !== "") {
    t = decodeURIComponent(window.location.hash.substring(1));
  }
  textField.innerHTML = t;
  setText(t);

  function setText(t: string) {
    window.location.hash = encodeURIComponent(t);
    size.x = window.innerWidth;
    size.y = window.innerHeight;
    //   c.width = size.x;
    //   c.height = size.y;
    speed = 1;
    pa = [];

    background();

    ctx.fillStyle = "black";
    const fontt = "'Noto Sans Mono'";
    ctx.font = 100 + "px " + fontt;
    const lines = t.split("\n");
    const fontMeasures = [];
    const fontSizes = [];
    let runningY = 0;
    const runningYS = [];
    for (let i = 0; i < lines.length; i++) {
      ctx.font = 100 + "px " + fontt;
      let measure = ctx.measureText(lines[i]);
      let bbox = {
        x: measure.actualBoundingBoxLeft,
        y: -measure.actualBoundingBoxAscent + runningY,
        w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
        h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
      };
      const fS = Math.floor((1000 / bbox.w) * 100);
      // console.log(fS);
      ctx.font = fS + "px " + fontt;
      measure = ctx.measureText(lines[i]);

      runningY += measure.actualBoundingBoxAscent * 1.4;
      bbox = {
        x: measure.actualBoundingBoxLeft,
        y: -measure.actualBoundingBoxAscent + runningY,
        w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
        h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
      };
      runningYS.push(runningY + 0);
      runningY += measure.actualBoundingBoxDescent * 1.4;
      fontSizes.push(fS);
      fontMeasures.push(bbox);
    }
    let measure = ctx.measureText(t);
    let bbox = {
      x: measure.actualBoundingBoxLeft,
      y: -measure.actualBoundingBoxAscent,
      w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
      h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
    };

    const bbbox = {
      h: fontMeasures[fontMeasures.length - 1].y + fontMeasures[fontMeasures.length - 1].h - fontMeasures[0].y,
      w: 0,
    };
    const sScale = Math.min((size.x - 200) / 1000, (size.y - 200) / bbbox.h);
    const heightOfFont = Math.floor(sScale * Math.min(...fontSizes));

    hsize = Math.min(Math.floor(heightOfFont / 20) + 1, Math.floor(Math.min(size.x, size.y) / 20) + 1);

    const s2 = [];
    for (let i = 0; i < lines.length; i++) {
      ctx.font = fontSizes[i] * sScale + "px " + fontt;
      //   mtext = ctx.measureText(t).width;
      measure = ctx.measureText(lines[i]);
      bbox = {
        x: measure.actualBoundingBoxLeft,
        y: -measure.actualBoundingBoxAscent,
        w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
        h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
      };

      ctx.fillText(
        lines[i],
        (size.x + bbox.w) / 2 - measure.actualBoundingBoxRight + measure.actualBoundingBoxLeft,
        size.y / 2 - fontMeasures[0].y * sScale - (bbbox.h * sScale) / 2 + runningYS[i] * sScale
      );
      s2.push({
        x: (size.x + bbox.w) / 2 - measure.actualBoundingBoxRight + measure.actualBoundingBoxLeft,
        y:
          size.y / 2 -
          fontMeasures[0].y * sScale -
          (bbbox.h * sScale) / 2 +
          runningYS[i] * sScale -
          1 * fontSizes[i] * sScale,
        fontSize: fontSizes[i] * sScale,
        text: lines[i],
      });
    }

    const ctext = ctx.getImageData(0, 0, size.x, size.y);
    const pixtext = ctext.data;

    for (let i = 0; i < pixtext.length; i += 4) {
      if (0 === pixtext[i] && (s++, 0 === s % hsize)) {
        const p = new Particle(i);
        p.heart();
        pa.push(p);
      }
    }

    setRText(s2);
  }
  createAnimationFrame(() => {
    ctx.resetTransform();
    ctx.scale(dpr(), dpr());
    background();
    const points = [];

    for (const i in pa) {
      const p = pa[i];
      p.tick();
      // p.heart();
      points.push([p.x, p.y]);
    }
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, size.x, size.y]);
    ctx.lineWidth = 1 / dpr();
    ctx.beginPath();
    ctx.strokeStyle = "white";
    voronoi.render(ctx);
    ctx.stroke();

    ctx.resetTransform();
  });
  window.onresize = () => {
    setText(gt());
  };
  window.addEventListener("load", () => {
    setText(gt());
  });
};

export const VoronoiDiagram = () => {
  let textField: HTMLDivElement;
  let canvas: HTMLCanvasElement;

  const { width: windowWidth, height: windowHeight, dpr } = createSizeSignal();
  const [rtext, setRText] = createSignal([{ text: "Hello", x: 0, y: 0, fontSize: 16 }]);
  onMount(() => {
    main(textField, canvas.getContext("2d")!, setRText);
    textField.focus();
  });
  createEffect(() => {
    const m = Cursor.getCurrentCursorPosition(textField);

    textField.innerHTML = "";
    rtext().map((x) => {
      textField.appendChild(
        <div style={{ "font-size": `${x.fontSize}px`, position: "absolute", top: x.y + "px", left: x.x + "px" }}>
          {x.text === "" ? <span style={{}}>{""}</span> : x.text}
        </div>
      );
    });
    // textField.appendChild(<span>.</span>);

    Cursor.setCurrentCursorPosition(m, textField);
  });
  return (
    <div style={{ width: "100vw", height: "100vh", position: "fixed", top: 0, bottom: 0 }}>
      <canvas
        ref={canvas!}
        width={windowWidth() * dpr()}
        height={windowHeight() * dpr()}
        style={{ width: "100vw", height: "100vh", position: "absolute", top: 0, bottom: 0 }}
      />
      <div
        ref={textField!}
        contentEditable={true}
        style={{
          display: "block",
          color: "transparent",
          width: "100vw",
          height: "100vh",
          position: "absolute",
          top: 0,
          left: 0,
          "font-family": "'Noto Sans Mono'",
          "line-height": 1.22,
        }}
      ></div>
    </div>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
import { BASE_DARK } from "../shared/constants";
const description = ``;
export const VoronoiDiagramExperiment: Experiment = {
  title: "Voronoi Diagram",
  component: VoronoiDiagram,
  imgUrl,
  description,
};
