import TWEEN from "@tweenjs/tween.js";
import * as PIXI from "pixi.js";
import { onMount } from "solid-js";

const main = (c: HTMLCanvasElement) => {
  let w = window.innerWidth;
  let h = window.innerHeight;

  const r = [14, 8];
  if (w / r[0] < h / r[1]) h = (r[1] * w) / r[0];
  else w = (r[0] * h) / r[1];

  const palettes = [
    [0x85d600, 0xde4a1f, 0xc4ff66, 0xe98263],
    [0x26b8f2, 0xf29a21, 0x90dbf9, 0xf7c47d],
  ];
  const myPalette = palettes[Math.floor(Math.random() * palettes.length)];
  const colors = "00101011".split("").map((index) => myPalette[+index]);

  const app = new PIXI.Application({
    view: c,
    width: w,
    height: h,
    backgroundColor: 0xebe8e7,
    antialias: true,
  });

  app.stage.interactive = true;

  const graphics = new PIXI.Graphics();
  app.stage.addChild(graphics);

  const averageGuy = {
    width: h / 32,
    height: h / 16,
  };
  let guys = [1, 2, 3, 4, 4, 3, 2, 1].map((amount, column) => {
    return [...Array(amount).keys()].map((y) => {
      return {
        offsetY: (h * (y + 1)) / (amount + 1) - h / 2,
        x: (column / 7) * ((w * 6) / 10) + (w * 2) / 10,
        y: 0,
        width: averageGuy.width,
        height: averageGuy.height,
        color: colors[column],
        collide: false,
      };
    });
  });

  const ball = {
    x: w / 2,
    y: h,
    vx: 0,
    vy: 0,
    speed: 9,
    decay: 0.99,
    maxSpeed: 10,
    minSpeed: 7,
    radius: h / 70,
    collide: true,
    alpha: 1,
  };
  const ballVel = (vx: number, vy: number) => {
    const length = Math.sqrt(vx ** 2 + vy ** 2);

    ball.vx = vx / length;
    ball.vy = vy / length;
  };
  const vy = -Math.random();
  const vx = (Math.random() * 0.25 + 0.005) * vy;
  ballVel((Math.random() >= 0.5 ? 1 : -1) * vx, vy);

  const redScore = new Array(5).fill(null).map(() => ({ scale: 0 }));
  const blueScore = new Array(5).fill(null).map(() => ({ scale: 0 }));

  let redDirection = 0;
  let blueDirection = 0;
  let redOffset = new Array(8).fill(h / 2);
  let blueOffset = new Array(8).fill(h / 2);

  window.addEventListener("keydown", (a) => {
    if (a.key === "ArrowUp") redDirection = -1;
    if (a.key === "w") blueDirection = -1;

    if (a.key === "ArrowDown") redDirection = 1;
    if (a.key === "s") blueDirection = 1;
  });

  window.addEventListener("keyup", (a) => {
    if (a.key === "ArrowUp" && -1 == redDirection) redDirection = 0;
    if (a.key === "w" && -1 == blueDirection) blueDirection = 0;

    if (a.key === "ArrowDown" && 1 == redDirection) redDirection = 0;
    if (a.key === "s" && 1 == blueDirection) blueDirection = 0;
  });

  const move = () => {
    ball.x += (ball.vx * ball.speed * h) / 1000;
    ball.y += (ball.vy * ball.speed * h) / 1000;
    ball.speed = Math.max(ball.speed * ball.decay, ball.minSpeed);
    if (ball.y - ball.radius > h / 3 && ball.y + ball.radius < (h * 2) / 3) {
      if (ball.x + ball.radius > w * 0.9) {
        const redZero = redScore.find((element) => element.scale == 0);
        new TWEEN.Tween(redZero!)
          .to(
            {
              scale: 0.9,
            },
            1000
          )
          .easing(TWEEN.Easing.Bounce.Out)
          .start();

        new TWEEN.Tween(ball)
          .to(
            {
              alpha: 0,
              x: w * 0.9 - ball.radius,
              y: h / 2,
            },
            1000
          )
          .chain(
            new TWEEN.Tween(ball)
              .to(
                {
                  alpha: 1,
                  x: w / 2,
                  y: h,
                },
                1000
              )
              .onComplete(() => {
                const vy = -Math.random();
                const vx = (Math.random() * 0.25 + 0.005) * vy;
                ballVel((Math.random() >= 0.5 ? 1 : -1) * vx, vy);
              })
          )
          .start();
      }
      if (ball.x - ball.radius < w * 0.1) {
        const blueZero = blueScore.find((element) => element.scale == 0);

        new TWEEN.Tween(blueZero!)
          .to(
            {
              scale: 0.9,
            },
            1000
          )
          .easing(TWEEN.Easing.Bounce.Out)
          .start();

        new TWEEN.Tween(ball)
          .to(
            {
              alpha: 0,
              x: w * 0.1 + ball.radius,
              y: h / 2,
            },
            1000
          )
          .chain(
            new TWEEN.Tween(ball)
              .to(
                {
                  alpha: 1,
                  x: w / 2,
                  y: h,
                },
                1000
              )
              .onComplete(() => {
                const vy = -Math.random();
                const vx = (Math.random() * 0.25 + 0.005) * vy;
                ballVel((Math.random() >= 0.5 ? 1 : -1) * vx, vy);
              })
          )
          .start();
      }
    }

    const wallBounce = 8;
    if (ball.y - ball.radius < 0) {
      ball.vy = -ball.vy;
      ball.y = 0 + ball.radius;
      ball.speed = wallBounce;
    }
    if (ball.y + ball.radius > h) {
      ball.vy = -ball.vy;
      ball.y = h - ball.radius;
      ball.speed = wallBounce;
    }
    if (ball.x - ball.radius < w * 0.1) {
      ball.vx = -ball.vx;
      ball.x = w * 0.1 + ball.radius;
      ball.speed = wallBounce;
    }
    if (ball.x + ball.radius > w * 0.9) {
      ball.vx = -ball.vx;
      ball.x = w * 0.9 - ball.radius;
      ball.speed = wallBounce;
    }

    redOffset = redOffset.map((current, index) => {
      const amount = [3, 3, 4, 5, 5, 4, 3, 3][index];
      current += ((redDirection / amount) * h) / 40;
      current = Math.min(
        Math.max(current, h / 2 - h / amount + averageGuy.height),
        h / 2 + h / amount - averageGuy.height
      );
      return current;
    });

    blueOffset = blueOffset.map((current, index) => {
      const amount = [3, 3, 4, 5, 5, 4, 3, 3][index];
      current += ((blueDirection / amount) * h) / 40;
      current = Math.min(
        Math.max(current, h / 2 - h / amount + averageGuy.height),
        h / 2 + h / amount - averageGuy.height
      );
      return current;
    });
    guys = guys.map((a, column) =>
      a.map((guy) => {
        let movement = 0;
        if (guy.color == myPalette[0]) {
          guy.y = guy.offsetY + redOffset[column];
          movement = 1;
        } else if (guy.color == myPalette[1]) {
          guy.y = guy.offsetY + blueOffset[column];
          movement = -1;
        }

        if (
          ball.x - ball.radius < guy.x + guy.width / 2 &&
          ball.x + ball.radius > guy.x - guy.width / 2 &&
          ball.y - ball.radius < guy.y + guy.height / 2 &&
          ball.y + ball.radius > guy.y - guy.height / 2
        ) {
          new TWEEN.Tween(guy)
            .to(
              {
                width: averageGuy.width * 2,
              },
              100
            )
            .chain(
              new TWEEN.Tween(guy).to(
                {
                  width: averageGuy.width,
                },
                100
              )
            )
            .start();

          if (guy.collide) {
            ballVel(Math.abs(ball.x - guy.x + guy.width / 2) * movement, ball.y - guy.y + guy.height / 2);
            ball.speed = ball.maxSpeed;
            guy.collide = false;
          }
        } else guy.collide = true;
        return guy;
      })
    );
  };

  const draw = () => {
    graphics.clear();
    graphics.lineStyle(0);
    graphics.beginFill(0x888888, ball.alpha);
    graphics.drawCircle(ball.x, ball.y, ball.radius);
    graphics.endFill();

    graphics.beginFill(0x888888, 1);
    graphics.drawRoundedRect(w * 0.1 - w / 80, h / 3, w / 40, h / 3, w / 160);
    graphics.drawRoundedRect(w * 0.9 - w / 80, h / 3, w / 40, h / 3, w / 160);
    graphics.endFill();
    graphics.beginFill(0xeeeeee, 1);
    graphics.drawRect(0, h / 3 + w / 80, w * 0.1, h / 3 - w / 40);
    graphics.drawRect(w * 0.9, h / 3 + w / 80, w * 0.1, h / 3 - w / 40);
    graphics.endFill();

    ([] as typeof guys[number]).concat(...guys).map((guy) => {
      graphics.beginFill(guy.color, 1);
      graphics.drawRoundedRect(guy.x - guy.width / 2, guy.y - guy.height / 2, guy.width, guy.height, guy.width / 2);
      graphics.endFill();
    });

    const scale = 1;
    graphics.beginFill(0xffffff, 1);
    for (let i = 0; i < 5; i++) {
      graphics.drawRoundedRect(
        w * 0.96 - h * 0.02 - w * 0.04 * scale,
        i * (0.005 * w - 0.2 * h) + scale * (w * 0.005 - h * 0.1) + 0.92 * h - 0.025 * w,
        w * 0.08 * scale,
        scale * (h * 0.2 - w * 0.01),
        10
      );
      graphics.drawRoundedRect(
        w * 0.04 + h * 0.02 - w * 0.04 * scale,
        i * (0.005 * w - 0.2 * h) + scale * (w * 0.005 - h * 0.1) + 0.92 * h - 0.025 * w,
        w * 0.08 * scale,
        scale * (h * 0.2 - w * 0.01),
        10
      );
    }
    graphics.endFill();

    graphics.beginFill(myPalette[2], 1);
    redScore.map((element, index) => {
      const s = element.scale;

      graphics.drawRoundedRect(
        w * 0.04 + h * 0.02 - w * 0.04 * s,
        index * (0.005 * w - 0.2 * h) + (0.92 * h - 0.025 * w) - s * (h * 0.1 - w * 0.005),
        w * 0.08 * s,
        s * (h * 0.2 - w * 0.01),
        10 * s
      );
    });
    graphics.endFill();

    graphics.beginFill(myPalette[3], 1);
    blueScore.map((element, index) => {
      const s = element.scale;
      graphics.drawRoundedRect(
        w * 0.96 - h * 0.02 - w * 0.04 * s,
        index * (0.005 * w - 0.2 * h) + (0.92 * h - 0.025 * w) - s * (h * 0.1 - w * 0.005),
        w * 0.08 * s,
        s * (h * 0.2 - w * 0.01),
        10 * s
      );
    });
    graphics.endFill();
  };

  app.ticker.add(() => {
    TWEEN.update();
    move();
    draw();
  });
};
export const Foosball = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return <canvas ref={c!} />;
};
