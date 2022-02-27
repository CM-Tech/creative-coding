import { onMount } from "solid-js";

function main(c: HTMLCanvasElement, textField: HTMLTextAreaElement) {
  let ctx = c.getContext("2d")!;
  let hsize = 5;
  let n = 1000;
  let speed = 1;
  let size = {
    x: document.body.clientWidth,
    y: window.innerHeight,
  };

  class f {
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
      ctx.bezierCurveTo(x + 0.1 * wi, y, x, y + 0.6 * he, x + 0.5 * wi, y + 0.9 * he);
      ctx.bezierCurveTo(x + 1 * wi, y + 0.6 * he, x + 0.9 * wi, y, x + 0.5 * wi, y + 0.3 * he);
      ctx.closePath();
      ctx.fill();
    }

    h() {
      let x = this.x;
      let y = this.y;
      let b = this.c;
      let l = this.j;
      let hsize = this.speed;
      x < l - this.c && ((this.x = l - b), (this.a *= -1));
      x > l + this.c && ((this.x = l + b), (this.a *= -1));
      y < hsize - b && ((this.y = hsize - b), (this.b *= -1));
      y > hsize + b && ((this.y = hsize + b), (this.b *= -1));
    }
    i() {
      this.a > n && (this.a = n);
      this.b > n && (this.b = n);
      this.x += this.a * this.d;
      this.y += this.b * this.d;
      this.h();
    }
  }

  function background() {
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 0, size.x, size.y);
  }

  function random(neg?: number) {
    let rand = Math.random();
    return neg ? 2 * rand - 1 : rand;
  }

  let s = 0;
  let pa: f[] = [];

  textField.innerHTML = "happy";
  setText("happy");

  function setText(t: string) {
    speed = 1;
    pa = [];
    clearInterval(s);

    background();

    ctx.fillStyle = "black";
    let fontt = "'Hachi Maru Pop'";
    ctx.font = 100 + "px " + fontt;
    let measure = ctx.measureText(t);
    let bbox = {
      x: measure.actualBoundingBoxLeft,
      y: -measure.actualBoundingBoxAscent,
      w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
      h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
    };
    let heightOfFont = Math.floor(Math.min((c.width - 200) / (bbox.w / 100), (c.height - 200) / (bbox.h / 100)));

    hsize = Math.min(Math.floor(heightOfFont / 20) + 1, Math.floor(Math.min(size.x, size.y) / 20) + 1);

    ctx.font = heightOfFont + "px " + fontt;
    measure = ctx.measureText(t);
    bbox = {
      x: measure.actualBoundingBoxLeft,
      y: -measure.actualBoundingBoxAscent,
      w: measure.actualBoundingBoxRight - measure.actualBoundingBoxLeft,
      h: measure.actualBoundingBoxAscent + measure.actualBoundingBoxDescent,
    };

    ctx.fillText(
      t,
      (size.x + bbox.w) / 2 - measure.actualBoundingBoxRight + measure.actualBoundingBoxLeft,
      size.y / 2 - bbox.y - bbox.h / 2
    );

    let ctext = ctx.getImageData(0, 0, size.x, size.y);
    let pixtext = ctext.data;

    for (let i = 0; i < pixtext.length; i += 4) {
      if (0 === pixtext[i] && (s++, 0 === s % hsize)) {
        let p = new f(i);
        p.heart();
        pa.push(p);
      }
    }
    s = setInterval(() => {
      background();
      for (let i in pa) {
        let p = pa[i];
        p.i();
        p.heart();
      }
    }, speed);
  }

  return setText;
}

export const ValentinesDay = () => {
  let c: HTMLCanvasElement;
  let field: HTMLTextAreaElement;
  let fn: (t: string) => void;
  onMount(() => {
    fn = main(c, field);
  });
  return (
    <>
      <canvas ref={c!} width={window.innerWidth} height={window.innerHeight} />
      <div class="well">
        <textarea ref={field!} onkeyup={(e) => fn(e.currentTarget.value)} />
      </div>
    </>
  );
};
