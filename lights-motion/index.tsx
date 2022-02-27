import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

const main = (canvas: HTMLCanvasElement) => {
  let ctx = canvas.getContext("2d")!;
  let s = 4;
  let P = 0.25; //0.33333;
  let mouse = { x: 0, y: 0, down: false };
  let stringLength = 16;
  let stringMinSpeed = 0.25;
  let stringMaxSpeed = 0.75;
  let stringsCount = 16;
  let strings: String[][] = [];
  let thicknesses: number[] = [];

  type String = {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };

  for (let j = 0; j < stringsCount; j++) {
    let string = [];
    //make a string
    for (let i = 0; i < stringLength; i++) {
      string.push({
        x: Math.random() * 100,
        y: Math.random() * 100,
        vx: 0,
        vy: 0,
      });
    }
    thicknesses.push(Math.random() * 0.5 + 0.2);
    //add it to the list of strings
    strings.push(string);
  }
  let gameSize = 800;
  let lastMove = 0;
  canvas.width = gameSize;
  canvas.height = gameSize;

  function bezIt(pts: String[], l: number) {
    let l0 = 1.0 - l;
    let nk = [];
    let K = -1.0;
    for (let i = 0; i < pts.length - 1; i++) {
      let nv = {
        vx: pts[i].vx * l0 + pts[i + 1].vx * l,
        vy: pts[i].vy * l0 + pts[i + 1].vy * l,
      };
      nk.push({
        x: pts[i].x * l0 + pts[i + 1].x * l + nv.vx * K,
        y: pts[i].y * l0 + pts[i + 1].y * l + nv.vy * K,
        vx: pts[i].vx * l0 + pts[i + 1].vx * l,
        vy: pts[i].vy * l0 + pts[i + 1].vy * l,
      });
    }
    return nk;
  }

  function bezRed(pts: String[], l: number) {
    let pk = pts;
    let l1 = l;
    while (pk.length > 1) {
      pk = bezIt(pk, l1);
      l1 = l1;
    }
    let K2 = 0 * l1;
    return { x: pk[0].x + pk[0].vx * K2, y: pk[0].y + pk[0].vy * K2 };
  }
  let timer = 0;

  function drawString(stringArray: String[], w: number) {
    let startHue = timer;
    ctx.beginPath();
    ctx.strokeStyle = "hsla(" + startHue + ",100%,50%," + w * 0.01 + ")";
    let k0 = bezRed(stringArray, 0);
    ctx.moveTo(k0.x, k0.y);

    ctx.beginPath();
    ctx.strokeStyle = "hsla(" + startHue + ",70%,50%," + w + ")";
    ctx.moveTo(stringArray[0].x, stringArray[0].y);

    for (let i = 1; i < stringArray.length; i += 1) {
      let pt = stringArray[i - 1];
      let pt2 = {
        x: stringArray[i].x + 0,
        y: stringArray[i].y + 0,
        vx: stringArray[i].vx + 0,
        vy: stringArray[i].vy + 0,
      };

      ctx.quadraticCurveTo(pt.x, pt.y, (pt.x + pt2.x) / 2, (pt.y + pt2.y) / 2);
    }
    ctx.stroke();
  }

  function moveString(stringArray: String[], stringSpeed: number) {
    stringArray[0].x = mouse.x;
    stringArray[0].y = mouse.y;
    stringArray[0].vx = 0;
    stringArray[0].vy = 0;
    let dis = 0;
    let SU = 1.0;
    for (let i = 1; i < stringArray.length; i++) {
      let stringS = stringSpeed;
      stringArray[i].vx = stringArray[i].vx * (1 - stringS) * SU;
      stringArray[i].vy = stringArray[i].vy * (1 - stringS) * SU;
      let m = P;
      let len =
        ((stringArray[i - 1].x - stringArray[i].x) ** 2 + (stringArray[i - 1].y - stringArray[i].y) ** 2) ** 0.5;
      let qe = 0.0;
      stringArray[i].vx +=
        (((stringArray[i - 1].x - stringArray[i].x) * stringS) / (len + 0.1)) * (-dis + len) * m +
        (stringArray[i - 1].vx - stringArray[i].vx) * qe;
      stringArray[i].vy +=
        (((stringArray[i - 1].y - stringArray[i].y) * stringS) / (len + 0.1)) * (-dis + len) * m +
        (stringArray[i - 1].vy - stringArray[i].vy) * qe;
    }
    let ss = 600;
    for (let i = 1; i < stringArray.length; i++) {
      let angle = Math.atan2(stringArray[i].vy, stringArray[i].vx);
      angle = Math.round(angle / ((Math.PI * 2) / ss)) * ((Math.PI * 2) / ss);
      stringArray[i].x += stringArray[i].vx;
      stringArray[i].y += stringArray[i].vy;
    }
  }
  let targetPos = { x: 0, y: 0 };
  let driftPos = { x: 0, y: 0 };
  let drift2Pos = { x: 0, y: 0 };
  window.setInterval(() => {
    driftPos = {
      x: (Math.random() / 2 + 0.25) * window.innerWidth,
      y: (Math.random() / 2 + 0.25) * window.innerHeight,
    };
  }, 1000);

  function render() {
    timer++;
    //clear the old drawing
    let lk = 0.06;

    let len = ((Math.hypot(driftPos.x - targetPos.x, driftPos.y - targetPos.y) + 1) / canvas.width) * 10;
    drift2Pos.x = drift2Pos.x * (1 - lk) + (lk * (driftPos.x - targetPos.x)) / len;
    drift2Pos.y = drift2Pos.y * (1 - lk) + (lk * (driftPos.y - targetPos.y)) / len;
    lk = 0.1;
    targetPos.x = targetPos.x * (1 - lk) + lk * (targetPos.x + drift2Pos.x);
    targetPos.y = targetPos.y * (1 - lk) + lk * (targetPos.y + drift2Pos.y);
    if (new Date().getTime() - lastMove > 2000) {
      mouse.x = targetPos.x * s;
      mouse.y = targetPos.y * s;
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = s;
    for (let i = 0; i < strings.length; i++) {
      drawString(strings[i], thicknesses[i]);
    }
  }
  createAnimationFrame(() => {
    for (let i = 0; i < strings.length; i++) {
      let spd = stringMinSpeed + (i / stringsCount) * (stringMaxSpeed - stringMinSpeed);
      moveString(strings[i], spd);
    }
    render();
  });

  window.addEventListener("mousemove", (event) => {
    mouse.x = event.clientX * s;
    mouse.y = event.clientY * s;
    lastMove = new Date().getTime();
  });

  function resizeH() {
    canvas.width = window.innerWidth * s;
    canvas.height = window.innerHeight * s;
  }
  window.addEventListener("resize", resizeH);
  resizeH();
};

export const LightsMotion = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return <canvas ref={c!} style={{ cursor: "none" }} />;
};
