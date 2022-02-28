import { onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

function Check(e: KeyboardEvent) {
  const keyCode = e.keyCode ? e.keyCode : e.which;
  if (keyCode == 13) {
    e.preventDefault();
  }
}

function main(c: HTMLCanvasElement, color: HTMLInputElement, yname: HTMLInputElement) {
  const ctx = c.getContext("2d")!;

  //making the canvas full screen
  c.height = window.innerHeight;
  c.width = window.innerWidth;
  color.value = "#00ff00";
  yname.value = "Bob, Bob JR";

  let imagedata = ctx.getImageData(0, 0, c.width, c.height);

  const font_size = 10;
  const columns = c.width / font_size; //number of columns for the rain

  //an array of drops - one per column
  const drops: { x: number; name: string; loop: number }[] = [];

  //x below is the x coordinate
  //1 = y co-ordinate of the drop(same for every drop initially)
  for (let x = 0; x < columns; x++) {
    drops[x] = {
      x: Math.floor(Math.random() * window.innerHeight + 1) + 1,
      name: "You are awesome",
      loop: Math.floor(Math.random() * "You are awesome".length + 1) + 1,
    };
  }
  //drawing the characters
  function draw() {
    c.height = window.innerHeight;
    c.width = document.body.clientWidth;

    ctx.putImageData(imagedata, 0, 0);

    //Black BG for the canvas
    //translucent BG to show trail
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.fillStyle = color.value; //green text
    ctx.font = "800 " + font_size + "px 'Andale Mono'";

    //looping over drops
    for (let i = 0; i < drops.length; i++) {
      let text;
      if (drops[i].name[drops[i].loop] == " ") {
        if (drops[i].loop < drops[i].name.length - 1) {
          drops[i].loop++;
          drops[i].x++;
        }
        text = drops[i].name[drops[i].loop];
      } else {
        text = drops[i].name[drops[i].loop];
      }
      ctx.fillText(text, i * font_size, drops[i].x * font_size * 0.8);

      //sending the drop back to the top randomly after it has crossed the screen
      //adding a randomness to the reset to make the drops scattered on the Y axis
      if (drops[i].x * font_size > c.height && Math.random() > 0.975) drops[i].x = 0;

      //incrementing Y coordinate
      drops[i].x++;
      drops[i].loop++;

      if (drops[i].loop >= drops[i].name.length) {
        const ynames = yname.value;
        const splitt = ynames.split(", ");
        drops[i].loop = 0;
        drops[i].name = splitt[Math.floor(Math.random() * splitt.length)] + "_ ";
      }
    }
    imagedata = ctx.getImageData(0, 0, c.width, c.height);
  }

  let timer = 0;
  function animloop() {
    if (timer == 5) {
      draw();
      timer = 0;
    }
    timer++;
  }
  createAnimationFrame(animloop);
}

export const NameRain = () => {
  let c: HTMLCanvasElement;
  let colo: HTMLInputElement;
  let yname: HTMLInputElement;
  onMount(() => {
    main(c, colo, yname);
  });
  return (
    <>
      <div class="well inputs">
        <input placeholder="Names of people in your family e.g. Bob, Greta, Sherman" onkeypress={Check} ref={yname!} />
        <input placeholder="color e.g. #00ff00" onkeyup={Check} ref={colo!} />
      </div>
      <canvas ref={c!} />
    </>
  );
};
