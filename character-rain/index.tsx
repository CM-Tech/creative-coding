import chroma from "chroma-js";
import { onMount } from "solid-js";
import { BASE_DARK, BASE_LIGHT, CYAN_MUL, MAGENTA_MUL, YELLOW_MUL } from "../shared/constants";
import { createAnimationFrame } from "../utils";

export const CharacterRain = () => {
  let c: HTMLCanvasElement;
  let textbox: HTMLInputElement;
  let col: HTMLInputElement;
  function Check(e: KeyboardEvent) {
    const keyCode = e.keyCode ? e.keyCode : e.which;
    if (keyCode == 13) {
      e.preventDefault();
    }
  }

  onMount(() => {
    //making the canvas full screen
    c.height = window.innerHeight;
    c.width = window.innerWidth;

    const ctx = c.getContext("2d")!;

    let timer = 0;
    const speed = 3;

    textbox.value = "O M G";
    //characters characters - taken from the unicode charset
    let characters = "0123456789-+-+==XX-+-+==XX".split("");
    //converting the string into an array of single characters

    col.value = "#0f0";
    const columns = (c.width * 100) / c.width; //number of columns for the rain
    //an array of drops - one per column
    const drops: { x: number; size: number; y: number; color: string }[] = [];

    //x below is the x coordinate
    //1 = y co-ordinate of the drop(same for every drop initially)
    for (let x = 0; x < columns; x++)
      drops[x] = {
        y: 1,
        size: Math.random() * 15 + 5,
        x: Math.random() * c.width,
        color: [CYAN_MUL, MAGENTA_MUL, YELLOW_MUL][Math.floor(Math.random() * 3)]
      };

    //drawing the characters

    function draw() {
      //Black BG for the canvas
      //translucent BG to show trail
      ctx.globalCompositeOperation = "multiply"
      ctx.fillStyle = "#fafafa";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = /* "'"+*/ col.value; //"'" //green text

      //a random characters character to print
      if (textbox.value == "") {
        characters = [" "];
      } else {
        characters = textbox.value.split("");
      }
      //looping over drops
      for (let i = 0; i < drops.length; i++) {
        ctx.font = drops[i].size + `px ${"'Noto Sans Mono'"}`;

        const text = characters[Math.floor(Math.random() * characters.length)];
        //x = i*font_size, y = value of drops[i]*font_size

        ctx.fillStyle = chroma(BASE_LIGHT).alpha(0.25).hex();
        ctx.globalCompositeOperation = "lighter"
        ctx.fillRect(drops[i].x, drops[i].y * drops[i].size, drops[i].size, drops[i].size)
        ctx.fillStyle = drops[i].color;

        ctx.globalCompositeOperation = "multiply"
        ctx.fillRect(drops[i].x, drops[i].y * drops[i].size, drops[i].size, drops[i].size)

        ctx.fillStyle = drops[i].color;
        ctx.globalCompositeOperation = "source-over"
        ctx.fillText(text, drops[i].x + drops[i].size * 0.2, drops[i].y * drops[i].size + drops[i].size * 0.4);

        //sending the drop back to the top randomly after it has crossed the screen
        //adding a randomness to the reset to make the drops scattered on the Y axis
        if (drops[i].y * drops[i].size > c.height && Math.random() > 0.975) {
          drops[i].y = 0;
          drops[i].x = Math.random() * c.width;
        }

        drops[i].y++;
      }
    }

    function animloop() {
      timer++;
      if (timer == speed) {
        draw();
        timer = 0;
      }
    }

    for (let i = 0; i < 100; i++) {
      draw();
    }
    createAnimationFrame(animloop);
  });
  return (
    <>
      <div class="well inputs">
        <input ref={textbox!} placeholder="Rain Content" onkeypress={Check} />
        <input placeholder="color e.g. #00ff00" ref={col!} onkeypress={Check} />
      </div>
      <canvas ref={c!} />
    </>
  );
};
