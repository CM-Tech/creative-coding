import { Delaunay } from "d3-delaunay";
import { onMount } from "solid-js";
import "./styles.css";

const main = (
  textField: HTMLTextAreaElement,
  ctx: CanvasRenderingContext2D
) => {
  let hsize = 5;
  let speed = 1;
  let size = {
    x: window.innerWidth,
    y: window.innerHeight,
  };

  function textChanged(event: KeyboardEvent | Event) {
    if ((event as KeyboardEvent).keyCode == 13) {
      event.preventDefault();
    } else {
      setText(textField.value);
    }
  }
  textField.addEventListener("change", textChanged);
  textField.addEventListener("keyup", textChanged);

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
      let g = (i / 4) % size.x;
      let t = Math.floor(i / 4 / size.x);
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
      let he = this.f;
      let wi = this.f;
      let x = this.x;
      let y = this.y;
      ctx.fillStyle = this.g;
      ctx.beginPath();
      ctx.moveTo(x + 0.5 * wi, y + 0.3 * he);
      ctx.bezierCurveTo(
        x + 0.1 * wi,
        y,
        x,
        y + 0.6 * he,
        x + 0.5 * wi,
        y + 0.9 * he
      );
      ctx.bezierCurveTo(
        x + 1 * wi,
        y + 0.6 * he,
        x + 0.9 * wi,
        y,
        x + 0.5 * wi,
        y + 0.3 * he
      );
      ctx.closePath();
      ctx.fill();
    }
    h() {
      let x = this.x;
      let y = this.y;
      let b = this.c;
      let l = this.j;
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
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, size.x, size.y);
  }

  function random(neg?: any) {
    let rand = Math.random();
    return neg ? 2 * rand - 1 : rand;
  }

  let s = 0;
  let pa: Particle[] = [];
  let t = "TYPE IN TOP LEFT";
  if (window.location.hash !== "") {
    t = decodeURIComponent(window.location.hash.substring(1));
  }
  document.getElementById("text")!.innerHTML = t;
  setText(t);

  function setText(t: string) {
    window.location.hash = encodeURIComponent(t);
    size.x = window.innerWidth;
    size.y = window.innerHeight;
    //   c.width = size.x;
    //   c.height = size.y;
    speed = 1;
    pa = [];
    clearInterval(s);

    background();

    ctx.fillStyle = "black";
    let fontt = "'Jost'";
    ctx.font = 100 + "px " + fontt;
    let lines = t.split("\n");
    let fontMeasures = [];
    let fontSizes = [];
    let runningY = 0;
    let runningYS = [];
    for (let i = 0; i < lines.length; i++) {
      ctx.font = 100 + "px " + fontt;
      let measure = ctx.measureText(lines[i]);
      let bbox = {
        x: measure.actualBoundingBoxLeft,
        y: -measure.actualBoundingBoxAscent + runningY,
        w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
        h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
      };
      let fS = Math.floor((1000 / bbox.w) * 100);
      // console.log(fS);
      ctx.font = fS + "px " + fontt;
      measure = ctx.measureText(lines[i]);

      runningY += measure.actualBoundingBoxAscent;
      bbox = {
        x: measure.actualBoundingBoxLeft,
        y: -measure.actualBoundingBoxAscent + runningY,
        w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
        h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
      };
      runningYS.push(runningY + 0);
      runningY += measure.actualBoundingBoxDescent;
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

    let bbbox = {
      h:
        fontMeasures[fontMeasures.length - 1].y +
        fontMeasures[fontMeasures.length - 1].h -
        fontMeasures[0].y,
      w: 0,
    };
    let sScale = Math.min((size.x - 200) / 1000, (size.y - 200) / bbbox.h);
    let heightOfFont = Math.floor(sScale * Math.min(...fontSizes));

    hsize = Math.min(
      Math.floor(heightOfFont / 20) + 1,
      Math.floor(Math.min(size.x, size.y) / 20) + 1
    );
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
        (size.x + bbox.w) / 2 -
          measure.actualBoundingBoxRight +
          measure.actualBoundingBoxLeft,
        size.y / 2 -
          fontMeasures[0].y * sScale -
          (bbbox.h * sScale) / 2 +
          runningYS[i] * sScale
      );
    }

    let ctext = ctx.getImageData(0, 0, size.x, size.y);
    let pixtext = ctext.data;

    for (let i = 0; i < pixtext.length; i += 4) {
      if (0 === pixtext[i] && (s++, 0 === s % hsize)) {
        let p = new Particle(i);
        p.heart();
        pa.push(p);
      }
    }
    s = setInterval( () =>{
      background();
      const points = [];

      for (let i in pa) {
        let p = pa[i];
        p.tick();
        // p.heart();
        points.push([p.x, p.y]);
      }
      const delaunay = Delaunay.from(points);
      const voronoi = delaunay.voronoi([0, 0, size.x, size.y]);
      ctx.beginPath();
      ctx.strokeStyle = "white";
      voronoi.render(ctx);
      ctx.stroke();
    }, speed);
  }
  window.onresize = () => {
    setText(textField.value);
  };
};

export const VoronoiDiagram = () => {
  let textField: HTMLTextAreaElement;
  let canvas: HTMLCanvasElement;
  onMount(() => {
    main(textField, canvas.getContext("2d")!);
  });
  return (
    <>
      <canvas
        id="canvas"
        ref={canvas!}
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>
      <span class="option-bar">
        <textarea id="text" ref={textField!}></textarea>
      </span>
    </>
  );
};
