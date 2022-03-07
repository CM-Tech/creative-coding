import chroma from "chroma-js";
import Hammer from "hammerjs";
import { createMemo, createSignal, onMount } from "solid-js";
import { BASE_DARK, BASE_LIGHT, CYAN_MUL, MAGENTA_MUL, YELLOW_MUL } from "../shared/constants";
import { createAnimationFrame, createSizeSignal } from "../utils";
const FONT_FAMILY = "'Noto Sans Mono'";
const hard_time = 500;
const HBK = chroma.blend(BASE_DARK, chroma.blend(MAGENTA_MUL, YELLOW_MUL, "multiply"), "screen").hex();
const PL = chroma.blend(BASE_DARK, YELLOW_MUL, "screen").hex();
const BO = chroma.blend(BASE_DARK, CYAN_MUL, "screen").hex();
const spawn_range = 4;
export const Warpy = () => {
  let c: HTMLCanvasElement;
  let min = Math.min(window.innerWidth, window.innerHeight);

  const { width: windowWidth, height: windowHeight, dpr: DP } = createSizeSignal();
  const minDimS = createMemo(() => Math.min(windowWidth(), windowHeight()));
  const [time, setTime] = createSignal(0);
  const zoom = createMemo(() => minDimS() / 4 * (Math.min(1, time() / 25)) * (1 + Math.max(0, Math.min(1, (time()) / hard_time))));

  onMount(() => {
    const ctx = c.getContext("2d")!;
    const you = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    };

    function randomThird(axis: number) {
      return axis / 2 + (1 * (Math.floor(Math.random() * 3) - 1));
    }
    class Bullet {
      x: number;
      y: number;
      vx: number;
      vy: number;
      constructor() {
        const wall = Math.random() < 0.5;
        this.x = wall
          ? spawn_range * 2 * (Math.round(Math.random()) - 0.5)
          : Math.random() > (time() >= hard_time ? 0.9 : 0.25)
            ? randomThird(0)
            : you.x;
        this.y = !wall
          ? spawn_range * 2 * (Math.round(Math.random()) - 0.5)
          : Math.random() > (time() >= hard_time ? 0.9 : 0.25)
            ? randomThird(0)
            : you.y;
        this.vx = wall ? Math.sign(0 - this.x) : 0;
        this.vy = !wall ? Math.sign(0 - this.y) : 0;
        const len = Math.sqrt(this.vy ** 2 + this.vx ** 2) || 1;
        this.vx /= len;
        this.vy /= len;
      }
      move() {
        this.x += (this.vx * 3) / (time() >= hard_time ? 200 : 300);
        this.y += (this.vy * 3) / (time() >= hard_time ? 200 : 300);
      }
      draw() {

        ctx.fillStyle = chroma(time() >= hard_time - 50 ? BASE_DARK : BO).alpha(Math.min(1, Math.max(0, 4 / (1 + Math.max(0, Math.min(1, (time() - hard_time + 50) / 50))) - Math.max(Math.abs(this.x), Math.abs(this.y))))).hex();
        ctx.fillRect(this.x - 1 / 8 / 2, this.y - 1 / 8 / 2, 1 / 8, 1 / 8);
      }
      die() {
        return this.x > spawn_range || this.x < -spawn_range || this.y > spawn_range || this.y < -spawn_range;
      }
    }


    class Blink {
      x: number;
      y: number;
      time: number;
      constructor() {
        this.x = you.x;
        this.y = you.y;
        this.time = 1 / 4;
      }
      die() {
        return this.time < 0;
      }
      draw() {
        ctx.fillStyle = BASE_LIGHT;
        ctx.fillRect(this.x - this.time / 2, this.y - this.time / 2, this.time, this.time);
        this.time -= 1 / 32;
      }
    }
    let bullets: Bullet[] = [];
    let animations: Blink[] = [];
    let running = true;
    function tick() {
      ctx.resetTransform();
      ctx.fillStyle = time() > hard_time ? HBK : BASE_DARK;
      ctx.fillRect(0, 0, c.width, c.height);

      if (time() >= hard_time - 50 && time() < hard_time) {
        ctx.fillStyle = HBK;
        const w = ((time() - hard_time + 50) / 50) * c.width;
        const h = ((time() - hard_time + 50) / 50) * c.height;
        ctx.fillRect(c.width / 2 - w / 2, c.height / 2 - h / 2, w, h);
      }
      ctx.font = `90px ${FONT_FAMILY}`;
      ctx.textBaseline = "top";
      ctx.textAlign = "left";
      ctx.fillStyle = BASE_LIGHT;
      ctx.fillText(`${time()}`, 10, 10);

      ctx.translate(c.width / 2, c.height / 2);
      ctx.scale(zoom(), zoom());
      if (time() % (time() >= hard_time ? 20 : 40) == 0 && running) bullets.push(new Bullet());
      bullets = bullets.filter((b) => !b.die());
      for (const b of bullets) {
        if (running && (time() < hard_time - 50 || time() >= hard_time)) b.move();
        b.draw();
        if (
          running &&
          (time() < hard_time - 50 || time() > hard_time) &&
          Math.max(Math.abs(b.x - you.x), Math.abs(you.y - b.y)) < 1 / 8
        ) {
          running = false;
        }
      }

      animations = animations.filter((a) => !a.die());
      for (const a of animations) {
        a.draw();
      }
      for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
          ctx.fillStyle = BASE_LIGHT;
          ctx.fillRect(i - 1 / 8 / 2, j - 1 / 8 / 2, 1 / 8, 1 / 8);
        }
      }

      ctx.fillStyle = PL;
      ctx.fillRect(you.x - 1 / 8 / 2, you.y - 1 / 8 / 2, 1 / 8, 1 / 8);

      ctx.resetTransform();
      if (!running) {
        ctx.font = `90px ${FONT_FAMILY}`;
        ctx.textBaseline = "middle";
        ctx.textAlign = "center";
        ctx.fillStyle = BASE_LIGHT;
        ctx.fillText(
          "ontouchstart" in window ? "Tap to play again" : "Press space to play again",
          c.width / 2,
          c.height / 2
        );
      }
      if (running) setTime(time() + 1);
    }
    createAnimationFrame(tick);

    document.addEventListener("keydown", (e) => {
      if (running) {
        if (e.keyCode == 37 && you.vx != -1) {
          animations.push(new Blink());
          you.vx = -1;
          you.x -= 1;
        }
        if (e.keyCode == 39 && you.vx != 1) {
          animations.push(new Blink());
          you.vx = 1;
          you.x += 1;
        }
        if (e.keyCode == 38 && you.vy != -1) {
          animations.push(new Blink());
          you.vy = -1;
          you.y -= 1;
        }
        if (e.keyCode == 40 && you.vy != 1) {
          animations.push(new Blink());
          you.vy = 1;
          you.y += 1;
        }
      } else {
        if (e.keyCode == 32) {
          you.x = 0;
          you.y = 0;
          bullets = [];
          setTime(0)
          running = true;
        }
      }
      you.x = Math.min(Math.max(you.x, -1), 1);
      you.y = Math.min(Math.max(you.y, -1), 1);
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
    const hammer = new Hammer(c);
    hammer.on("swipe", (e) => {
      if (running) {
        if (e.direction == 2) {
          animations.push(new Blink());
          you.x -= 1;
        }
        if (e.direction == 4) {
          animations.push(new Blink());
          you.x += 1;
        }
        if (e.direction == 8) {
          animations.push(new Blink());
          you.y -= 1;
        }
        if (e.direction == 16) {
          animations.push(new Blink());
          you.y += 1;
        }
        you.x = Math.min(Math.max(you.x, -1), 1);
        you.y = Math.min(Math.max(you.y, -1), 1);
      }
    });
    hammer.get("swipe").set({ direction: Hammer.DIRECTION_ALL });
    hammer.on("tap", () => {
      if (!running) {
        you.x = 0;
        you.y = 0;
        bullets = [];
        setTime(0)
        running = true;
      }
    });
  });

  return (
    <>
      <canvas ref={c!} width={windowWidth() * DP()} height={windowHeight() * DP()} style={{ width: "100%", height: "100%" }} />
    </>
  );
};
