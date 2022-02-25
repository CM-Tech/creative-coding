import { onMount } from "solid-js";

export const CharacterRain = () => {
  let c: HTMLCanvasElement;

  function Check(e: KeyboardEvent) {
    let keyCode = e.keyCode ? e.keyCode : e.which;
    if (keyCode == 13) {
      e.preventDefault();
    }
  }

  onMount(() => {
    //making the canvas full screen
    c.height = window.innerHeight;
    c.width = window.innerWidth;

    let ctx = c.getContext("2d")!;
    let textbox = document.getElementById("textbox")!;
    let imagedata = ctx.getImageData(0, 0, c.width, c.height);

    let timer = 0;
    let speed = 3;

    document.getElementById("textbox")!.innerHTML = "❆✵⛄";
    //characters characters - taken from the unicode charset
    let characters = "0123456789-+-+==XX-+-+==XX".split("");
    //converting the string into an array of single characters
    let col = document.getElementById("colo")!;
    col.innerHTML = "#0f0";
    let columns = (c.width * 100) / c.width; //number of columns for the rain
    //an array of drops - one per column
    let drops: { x: number; size: number; y: number }[] = [];

    //x below is the x coordinate
    //1 = y co-ordinate of the drop(same for every drop initially)
    for (let x = 0; x < columns; x++)
      drops[x] = {
        y: 1,
        size: Math.random() * 15 + 5,
        x: Math.random() * c.width,
      };

    //drawing the characters

    function draw() {
      ctx.clearRect(0, 0, c.width, c.height);
      ctx.putImageData(imagedata, 0, 0);
      //Black BG for the canvas
      //translucent BG to show trail
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = /* "'"+*/ col.innerHTML; //"'" //green text

      //a random characters character to print
      if (textbox.innerHTML == "") {
        characters = [" "];
      } else {
        characters = textbox.innerHTML.split("");
      }
      //looping over drops
      for (let i = 0; i < drops.length; i++) {
        ctx.font = drops[i].size + "px Times";

        let text = characters[Math.floor(Math.random() * characters.length)];
        //x = i*font_size, y = value of drops[i]*font_size
        ctx.fillText(text, drops[i].x, drops[i].y * drops[i].size);

        //sending the drop back to the top randomly after it has crossed the screen
        //adding a randomness to the reset to make the drops scattered on the Y axis
        if (drops[i].y * drops[i].size > c.height && Math.random() > 0.975) {
          drops[i].y = 0;
          drops[i].x = Math.random() * c.width;
        }

        drops[i].y++;
      }
      imagedata = ctx.getImageData(0, 0, c.width, c.height);
    }

    function animloop() {
      timer++;
      if (timer == speed) {
        draw();
        timer = 0;
      }
      requestAnimationFrame(animloop);
    }

    for (let i = 0; i < 100; i++) {
      draw();
    }
    animloop();
  });
  return (
    <>
      <span class="option-bar">
        <div id="textbox" data-ph="Rain Content" onkeypress={Check} contenteditable={true}></div>
        <div data-ph="color e.g. #00ff00" id="colo" onkeypress={Check} contenteditable={true}></div>
      </span>
      <canvas id="c" ref={c!}></canvas>
    </>
  );
};
