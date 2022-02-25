import Hammer from "hammerjs";
import { onMount } from "solid-js";
import "./style.css";

export const Warpy = () => {
  let c: HTMLCanvasElement;
  let min = Math.min(window.innerWidth, window.innerHeight);
  onMount(() => {
    let ctx = c.getContext("2d")!;
    let you = {
      x: c.width / 2,
      y: c.height / 2,
      vx: 0,
      vy: 0,
    };

    function randomThird(axis: number) {
      return axis / 2 + (min * (Math.floor(Math.random() * 3) - 1)) / 4;
    }
    class Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      constructor() {
        let wall = Math.random() < 0.5;
        this.x = wall
          ? c.width * Math.round(Math.random())
          : Math.random() > (time > 1050 ? 0.9 : 0.25)
          ? randomThird(c.width)
          : you.x;
        this.y = !wall
          ? c.height * Math.round(Math.random())
          : Math.random() > (time > 1050 ? 0.9 : 0.25)
          ? randomThird(c.height)
          : you.y;
        this.vx = wall ? Math.sign(c.width / 2 - this.x) : 0;
        this.vy = !wall ? Math.sign(c.height / 2 - this.y) : 0;
        let len = Math.sqrt(this.vy ** 2 + this.vx ** 2) || 1;
        this.vx /= len;
        this.vy /= len;
      }
      move() {
        this.x += (this.vx * min) / (time > 1050 ? 150 : 300);
        this.y += (this.vy * min) / (time > 1050 ? 150 : 300);
      }
      draw() {
        ctx.fillStyle = time > 1000 ? "#51081b" : "darkblue";
        ctx.fillRect(this.x - 5, this.y - 5, 10, 10);
      }
      die() {
        return (
          this.x > c.width || this.x < 0 || this.y > c.height || this.y < 0
        );
      }
    }

    let time = 0;

    class Blink {
      x: number;
      y: number;
      time: number;
      constructor() {
        this.x = you.x;
        this.y = you.y;
        this.time = 20;
      }
      die() {
        return this.time < 0;
      }
      draw() {
        ctx.fillStyle = "white";
        ctx.fillRect(
          this.x - this.time / 2,
          this.y - this.time / 2,
          this.time,
          this.time
        );
        this.time--;
      }
    }
    let bullets: Bullet[] = [];
    let animations: Blink[] = [];
    let running = true;
    function tick() {
      ctx.fillStyle = time > 1050 ? "salmon" : "lightblue";
      ctx.fillRect(0, 0, c.width, c.height);

      if (time > 1000 && time < 1050) {
        ctx.fillStyle = "salmon";
        let w = ((time - 1000) / 50) * c.width,
          h = ((time - 1000) / 50) * c.height;
        ctx.fillRect(c.width / 2 - w / 2, c.height / 2 - h / 2, w, h);
      }
      ctx.font = "90px serif";
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillStyle = "white";
      ctx.fillText(`${time}`, 10, 10);
      if (time % (time > 1050 ? 20 : 40) == 0 && running)
        bullets.push(new Bullet());
      bullets = bullets.filter((b) => !b.die());
      for (let b of bullets) {
        if (running && (time < 1000 || time > 1050)) b.move();
        b.draw();
        if (
          running &&
          (time < 1000 || time > 1050) &&
          b.x + 5 > you.x - 10 &&
          b.y + 5 > you.y - 10 &&
          b.x - 5 < you.x + 10 &&
          b.y - 5 < you.y + 10
        ) {
          running = false;
        }
      }

      animations = animations.filter((a) => !a.die());
      for (let a of animations) {
        a.draw();
      }
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          ctx.fillStyle = "white";
          ctx.fillRect(
            c.width / 2 + (min * i) / 4 - 3,
            c.height / 2 + (min * j) / 4 - 3,
            6,
            6
          );
        }
      }

      ctx.fillStyle = "gray";
      ctx.fillRect(you.x - 10, you.y - 10, 20, 20);

      if (!running) {
        ctx.font = "90px serif";
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = "white";
        ctx.fillText(
          "ontouchstart" in window
            ? "Tap to play again"
            : "Press space to play again",
          c.width / 2,
          c.height / 2
        );
      }
      if (running) time++;
      window.requestAnimationFrame(tick);
    }
    tick();

    document.addEventListener("keydown", (e) => {
      if (running) {
        if (e.keyCode == 37 && you.vx != -1) {
          animations.push(new Blink());
          you.vx = -1;
          you.x -= min / 4;
        }
        if (e.keyCode == 39 && you.vx != 1) {
          animations.push(new Blink());
          you.vx = 1;
          you.x += min / 4;
        }
        if (e.keyCode == 38 && you.vy != -1) {
          animations.push(new Blink());
          you.vy = -1;
          you.y -= min / 4;
        }
        if (e.keyCode == 40 && you.vy != 1) {
          animations.push(new Blink());
          you.vy = 1;
          you.y += min / 4;
        }
      } else {
        if (e.keyCode == 32) {
          you.x = c.width / 2;
          you.y = c.height / 2;
          bullets = [];
          time = 0;
          running = true;
        }
      }
      you.x = Math.min(
        Math.max(you.x, c.width / 2 - min / 4),
        c.width / 2 + min / 4
      );
      you.y = Math.min(
        Math.max(you.y, c.height / 2 - min / 4),
        c.height / 2 + min / 4
      );
    });

    document.addEventListener("keyup", (e) => {
      if (e.keyCode == 37 && you.vx == -1) you.vx = 0;
      if (e.keyCode == 39 && you.vx == 1) you.vx = 0;
      if (e.keyCode == 38 && you.vy == -1) you.vy = 0;
      if (e.keyCode == 40 && you.vy == 1) you.vy = 0;
    });

    window.addEventListener("resize", () => {
      c.width = window.innerWidth;
      c.height = window.innerHeight;
      min = Math.min(c.width, c.height);
    });

    document.body.ontouchmove = (e) => {
      e.preventDefault();
    };
    let hammer = new Hammer(c);
    hammer.on("swipe", (e) => {
      if (running) {
        if (e.direction == 2) {
          animations.push(new Blink());
          you.x -= min / 4;
        }
        if (e.direction == 4) {
          animations.push(new Blink());
          you.x += min / 4;
        }
        if (e.direction == 8) {
          animations.push(new Blink());
          you.y -= min / 4;
        }
        if (e.direction == 16) {
          animations.push(new Blink());
          you.y += min / 4;
        }
        you.x = Math.min(
          Math.max(you.x, c.width / 2 - min / 4),
          c.width / 2 + min / 4
        );
        you.y = Math.min(
          Math.max(you.y, c.height / 2 - min / 4),
          c.height / 2 + min / 4
        );
      }
    });
    hammer.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
    hammer.on("tap", () => {
      if (!running) {
        you.x = c.width / 2;
        you.y = c.height / 2;
        bullets = [];
        time = 0;
        running = true;
      }
    });
  });

  return (
    <>
      <canvas
        id="c"
        ref={c!}
        width={window.innerWidth}
        height={window.innerHeight}
      ></canvas>
    </>
  );
};
