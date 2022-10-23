import chroma from "chroma-js";
import { createMemo, onCleanup, onMount } from "solid-js";
import { BASE_DARK, BASE_LIGHT, CYAN_MUL, MAGENTA_MUL, YELLOW_MUL } from "../shared/constants";
import { createAnimationFrame, createSizeSignal } from "../utils";

export const CharacterRain = () => {
  const { width, height, dpr } = createSizeSignal();
  let c: HTMLCanvasElement;
  let textbox: HTMLInputElement;
  function Check(e: KeyboardEvent) {
    const keyCode = e.keyCode ? e.keyCode : e.which;
    if (keyCode == 13) {
      e.preventDefault();
    }
  }
  const area = createMemo(() => width() * height() * dpr() * dpr());
  const columns = 64; //number of columns for the rain
  const genDrop = () => {
    return {
      y: 0, //Math.random() * c.height,
      size: ((Math.random() * 0.5 + 0.75) * Math.sqrt(area())) / columns,
      x: Math.random() * c.width,
      color: [CYAN_MUL, MAGENTA_MUL, YELLOW_MUL][Math.floor(Math.random() * 3)],
    };
  };

  onMount(() => {
    //making the canvas full screen

    const ctx = c.getContext("2d")!;

    let timer = 0;
    const speed = 3;

    textbox.value = "|:.";
    //characters characters - taken from the unicode charset
    let characters = "0123456789-+-+==XX-+-+==XX".split("");
    //converting the string into an array of single characters

    //an array of drops - one per column
    const drops: { x: number; size: number; y: number; color: string }[] = [];

    //x below is the x coordinate
    //1 = y co-ordinate of the drop(same for every drop initially)
    for (let x = 0; x < columns; x++) drops[x] = genDrop();

    //drawing the characters

    function draw() {
      //Black BG for the canvas
      //translucent BG to show trail
      ctx.globalCompositeOperation = "multiply";
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, c.width, c.height);

      //a random characters character to print
      if (textbox.value == "") {
        characters = [" "];
      } else {
        characters = textbox.value.split("");
      }
      //looping over drops
      for (let i = 0; i < drops.length; i++) {
        ctx.font = `${(drops[i].size * 5) / 6}px ${"'Noto Sans Mono'"}`;

        const text = characters[Math.floor(Math.random() * characters.length)];
        const rWidth = (drops[i].size * 3) / 6;
        const rHeight = drops[i].size;
        ctx.fillStyle = chroma(BASE_LIGHT).alpha(0.25).hex();
        ctx.globalCompositeOperation = "lighter";
        ctx.fillRect(drops[i].x, drops[i].y * drops[i].size, rWidth, rHeight);
        ctx.fillStyle = drops[i].color;

        ctx.globalCompositeOperation = "multiply";
        ctx.fillRect(drops[i].x, drops[i].y * drops[i].size, rWidth, rHeight);

        ctx.fillStyle = drops[i].color;
        ctx.globalCompositeOperation = "source-over";
        const tDims = ctx.measureText(text);
        ctx.fillText(
          text,
          drops[i].x + rWidth / 2 - tDims.width / 2,
          drops[i].y * drops[i].size +
            rHeight / 2 +
            (tDims.actualBoundingBoxAscent - tDims.actualBoundingBoxDescent) / 2
        );

        //sending the drop back to the top randomly after it has crossed the screen
        //adding a randomness to the reset to make the drops scattered on the Y axis
        drops[i].y++;
        if (drops[i].y * drops[i].size > c.height) {
          drops[i] = genDrop();
        }
      }
      ctx.globalCompositeOperation = "source-over";
      // ctx.fillStyle = BASE_LIGHT;
      // ctx.font = `${64}px ${"'Noto Sans Mono'"}`;
      // ctx.fillText("Character Rain", 8, 64 + 8);
    }

    function animloop() {
      timer++;
      if (timer % speed === 0) {
        draw();
        timer = 0;
      }
    }

    for (let i = 0; i < columns * 2; i++) {
      draw();
    }
    createAnimationFrame(animloop);
  });
  const pUnit = createMemo(() => Math.min(width(), height()) / 16);
  return (
    <>
      <canvas ref={c!} style={{ width: "100vw", height: "100vh" }} width={width() * dpr()} height={height() * dpr()} />
      <div style={{ bottom: 0, top: "auto", position: "fixed", left: 0, right: 0 }}>
        <input
          ref={textbox!}
          placeholder="Rain Content"
          onkeypress={Check}
          style={{
            margin: `${pUnit()}px`,
            width: `${width() - pUnit() * 2}px`,
            "font-size": `${pUnit()}px`,
            padding: `${pUnit() * 0.5}px`,
            "box-sizing": "border-box",
            border: 0,
            outline: 0,
            "font-family": "'Noto Sans Mono'",
            background: chroma(BASE_DARK).alpha(0.5).hex(),
            color: BASE_LIGHT,
          }}
        />
      </div>
    </>
  );
};

import imgUrl from "./README.png?url";
import { Experiment } from "../shared/types";
const description = ``;
export const CharacterRainExperiment: Experiment = {
  title: "Character Rain",
  component: CharacterRain,
  imgUrl,
  description,
};
