import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";
import "./style.css";

const main = (c: HTMLCanvasElement) => {
  const ctx = c.getContext("2d")!;
  c.height = window.innerHeight;
  c.width = window.innerWidth;

  const bubbles: bubble[] = [];
  const colors = ["#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
  let color = colors[Math.floor(Math.random() * colors.length)];
  let fake = colors[Math.floor(Math.random() * colors.length)];
  let score = 0;
  let lives = 3;
  let clicked = false;
  const settime = 150;
  let time = settime;
  let incorrect = 0;

  class bubble {
    x: number;
    y: number;
    dirX: number;
    dirY: number;
    color: string;
    speedX: number;
    speedY: number;
    constructor(color: string) {
      const w = Math.floor(Math.random() * 4 + 1);
      this.x =
        w == 1 || w == 3
          ? Math.floor(Math.random() * (window.innerWidth - 50) + 25)
          : w == 4
          ? -25
          : window.innerWidth + 25;
      this.y =
        w == 2 || w == 4
          ? Math.floor(Math.random() * (window.innerWidth - 50) + 25)
          : w == 1
          ? -25
          : window.innerWidth + 25;

      let wall = Math.floor(Math.random() * 4 + 1);
      if (wall == w) {
        if (wall < 4) {
          wall += 1;
        } else {
          wall = Math.floor(Math.random() * 3 + 1);
        }
      }

      this.dirX =
        wall == 1 || wall == 3
          ? Math.floor(Math.random() * (window.innerWidth - 50) + 25)
          : wall == 4
          ? -25
          : window.innerWidth + 25;
      this.dirY =
        wall == 2 || wall == 4
          ? Math.floor(Math.random() * (window.innerWidth - 50) + 25)
          : wall == 1
          ? -25
          : window.innerWidth + 25;

      this.color = color;
      this.speedX = -(this.x - this.dirX) / 500;
      this.speedY = -(this.y - this.dirY) / 500;
    }
  }

  function draw() {
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fill();
    for (let i = 0; i < bubbles.length; i++) {
      bubbles[i].x += bubbles[i].speedX * 2;
      bubbles[i].y += bubbles[i].speedY * 2;
      drawbubble(bubbles[i].x, bubbles[i].y, bubbles[i].color);
      if (
        bubbles[i].x > window.innerWidth + 50 ||
        bubbles[i].y > window.innerHeight + 50 ||
        bubbles[i].x < -50 ||
        bubbles[i].y < -50
      ) {
        bubbles.splice(i, 1);
        i--;
      }
    }
    ctx.fillStyle = fake;
    ctx.font = "60px 'Comfortaa'";
    let tcolor!: string;
    switch (color) {
      case "#ff0000":
        tcolor = "Red";
        break;
      case "#00ff00":
        tcolor = "Green";
        break;
      case "#0000ff":
        tcolor = "Dark Blue";
        break;
      case "#ff00ff":
        tcolor = "Purple";
        break;
      case "#ffff00":
        tcolor = "Yellow";
        break;
      case "#00ffff":
        tcolor = "Light Blue";
        break;
    }

    const width = ctx.measureText(tcolor).width;
    ctx.fillText(tcolor, (window.innerWidth - width) / 2, (window.innerHeight - 30) / 2);

    ctx.font = "30px 'Comfortaa'";
    ctx.fillStyle = "black";
    if (!clicked) {
      ctx.fillText(
        "Tap the bubble with the text you read, not the color you see",
        (window.innerWidth - ctx.measureText("Tap the bubble with the text you read, not the color you see").width) / 2,
        window.innerHeight - 30
      );
    }

    ctx.font = "30px 'Comfortaa'";
    ctx.fillStyle = "black";
    ctx.fillText("Score: " + score, 0, 30);
    ctx.fillText("Lives: " + lives, window.innerWidth - ctx.measureText("Lives: " + lives).width, 30);

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.fillStyle = "black";
    ctx.lineWidth = 10;
    ctx.moveTo(window.innerWidth / 2, window.innerHeight / 2 + 60);
    ctx.arc(
      window.innerWidth / 2,
      window.innerHeight / 2 + 60,
      50,
      1.5 * Math.PI,
      (1.5 + (time * 2) / (settime + incorrect)) * Math.PI,
      true
    );
    ctx.lineTo(window.innerWidth / 2, window.innerHeight / 2 + 60);
    ctx.fill();
  }

  function drawbubble(x: number, y: number, color: string) {
    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.strokeStyle = LightenDarkenColor(color, 50);
    ctx.lineWidth = 12;
    ctx.arc(x, y, 50, 0 * Math.PI, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = 7;
    ctx.strokeStyle = LightenDarkenColor("#ffffff", -20);
    ctx.arc(x, y, 40, 1.6 * Math.PI, 1.9 * Math.PI);
    ctx.fill();
    ctx.stroke();
  }
  const dend = false;

  function drawend() {
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
    ctx.fill();
    for (let i = 0; i < bubbles.length; i++) {
      bubbles[i].x += bubbles[i].speedX * 2;
      bubbles[i].y += bubbles[i].speedY * 2;
      drawbubble(bubbles[i].x, bubbles[i].y, bubbles[i].color);
      if (
        bubbles[i].x > window.innerWidth + 50 ||
        bubbles[i].y > window.innerHeight + 50 ||
        bubbles[i].x < -50 ||
        bubbles[i].y < -50
      ) {
        bubbles.splice(i, 1);
        i--;
      }
    }
    ctx.font = "90px 'Comfortaa'";
    ctx.fillStyle = "black";
    ctx.fillText(
      "Score: " + score,
      (window.innerWidth - ctx.measureText("Score" + score).width) / 2,
      (window.innerHeight - 120) / 2
    );
    ctx.font = "30px 'Comfortaa'";
    ctx.fillText(
      "Press space to restart",
      (window.innerWidth - ctx.measureText("Press space to restart").width) / 2,
      window.innerHeight / 2
    );
  }

  function LightenDarkenColor(col: string, amt: number) {
    col = col.slice(1);

    const num = parseInt(col, 16);

    let r = (num >> 16) + amt;

    if (r > 255) r = 255;
    else if (r < 0) r = 0;

    let b = ((num >> 8) & 0x00ff) + amt;

    if (b > 255) b = 255;
    else if (b < 0) b = 0;

    let g = (num & 0x0000ff) + amt;

    if (g > 255) g = 255;
    else if (g < 0) g = 0;

    return "#" + (g | (b << 8) | (r << 16)).toString(16);
  }

  function animate(elem: HTMLElement, animation: string) {
    elem.classList.add("animated", animation);
    elem.addEventListener(
      "animationend",
      () => {
        elem.classList.remove("animated", animation);
      },
      false
    );
  }
  document.body.onclick = (event) => {
    const mouseX = event.clientX;
    const mouseY = event.clientY;
    let correct = false;
    let ondot = false;
    if (lives >= 0) {
      for (let i = 0; i < bubbles.length; i++) {
        const xd = Math.pow(Math.abs(mouseX - bubbles[i].x), 2);
        const yd = Math.pow(Math.abs(mouseY - bubbles[i].y), 2);
        const dis = Math.sqrt(xd + yd);
        if (dis < 100) {
          ondot = true;
          if (bubbles[i].color == color) {
            correct = true;
            break;
          }
        }
      }
    }
    if (ondot) {
      if (correct) {
        score++;
        incorrect -= 25;
        animate(c, "bounce");
        time = settime + incorrect;
      } else {
        lives--;
        incorrect += 50;
        if (lives >= 0) {
          animate(c, "headShake");
        }
      }
      fake = colors[Math.floor(Math.random() * colors.length)];
      color = colors[Math.floor(Math.random() * colors.length)];
      clicked = true;
    }
  };
  document.body.onkeypress = (event) => {
    if (lives < 0 && event.keyCode == 32) {
      console.log("restart");
      lives = 3;
      score = 0;
      clicked = false;
      time = 0;
      timer = 0;
    }
  };
  document.body.onresize = () => {
    c.height = window.innerHeight;
    c.width = window.innerWidth;
  };
  for (let i = 0; i < (window.innerWidth * window.innerHeight) / 19000; i++) {
    bubbles.push(new bubble(colors[Math.floor(Math.random() * colors.length)]));
    for (let z = 0; z < 10; z++) {
      bubbles[i].x += bubbles[i].speedX * 2;
      bubbles[i].y += bubbles[i].speedY * 2;
    }
  }
  let timer = 0;
  function animloop() {
    if (lives >= 0) {
      draw();
      if (time === 0) {
        lives--;
        incorrect += 50;
        time = settime + incorrect;
        animate(c, "headShake");
      }
    } else {
      if (!dend) {
        animate(c, "rubberBand");
      }
      drawend();
    }
    if (timer == 100) {
      for (let i = 0; i < (window.innerWidth * window.innerHeight) / 19000; i++) {
        bubbles.push(new bubble(colors[Math.floor(Math.random() * colors.length)]));
      }
      timer = 0;
    }
    time--;
    timer++;
  }
  createAnimationFrame(animloop);
};

export const ColorBlind = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return <canvas ref={c!} style={{ width: "100%", height: "100%" }} />;
};
