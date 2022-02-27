import { onMount } from "solid-js";
import { epicWin, loses, wins, pauses } from "./ascii";
let chinese = "田由甲申甴电甶男甸甹町画甼甽甾甿畀畁畂畃畄畅畆畇畈畉畊畋界畍畎畏畐畑".split("");

function main(c: HTMLCanvasElement, progressbar: HTMLProgressElement) {
  let ctx = c.getContext("2d")!;
  let lose = false;
  let blue = false;
  let blurry = false;
  let timer = 0;
  let speed = 3;
  let gametime = 0;
  let running = true;
  let you = 50;
  let progress = you;
  let keypram = 0.5;
  let imagedata = ctx.getImageData(0, 0, c.width, c.height);
  let timer2 = 0;
  let timeo2: number, timeo3: number;

  let font_size = 10;
  let columns = c.width / font_size;

  //an array of drops - one per column
  let drops: number[] = [];

  //x below is the x coordinate
  //1 = y co-ordinate of the drop(same for every drop initially)
  for (let x = 0; x < columns; x++) {
    drops[x] = 1;
  }

  //drawing the characters
  function draw() {
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.putImageData(imagedata, 0, 0);
    //Black BG for the canvas
    //translucent BG to show trail
    ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.fillStyle = "#0F0"; //green text
    ctx.font = font_size + "px arial";
    //looping over drops
    for (let i = 0; i < drops.length; i++) {
      //a random chinese character to print
      let text = chinese[Math.floor(Math.random() * chinese.length)];
      //x = i*font_size, y = value of drops[i]*font_size
      ctx.fillText(text, i * font_size, drops[i] * font_size);

      //sending the drop back to the top randomly after it has crossed the screen
      //adding a randomness to the reset to make the drops scattered on the Y axis
      if (drops[i] * font_size > c.height && Math.random() > 0.975) drops[i] = 0;

      //incrementing Y coordinate
      drops[i]++;
    }
    imagedata = ctx.getImageData(0, 0, c.width, c.height);
    if (running === true) {
      ctx.beginPath();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "red";
      ctx.fillRect(c.width * (progress / 100), 0, c.width * (1 - progress / 100), c.height);
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
    } else {
    }
  }
  window.onblur = () => {
    blurry = true;
    running = false;
    if (blue === true) {
      ctx.beginPath();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
    }
    let fontsize = 10;
    let text = pauses;
    ctx.fillStyle = "#ff0";
    ctx.font = "800 " + fontsize + "px 'Andale Mono'";
    for (let i = 0; i < text.length; i++) {
      let measured = ctx.measureText(text[i]);
      ctx.fillText(text[i], (c.width - measured.width) / 2, (c.height - fontsize * text.length) / 2 + fontsize * i);
    }
    ctx.font = "300 " + fontsize * 2 + "px 'Andale Mono'";
    ctx.fillText(
      "Press space to unpause",
      (c.width - ctx.measureText("Press space to unpause").width) / 2,
      (c.height + fontsize * text.length + 10 + fontsize * 2) / 2
    );
  };
  window.onkeyup = (e) => {
    let keyCode = e.keyCode ? e.keyCode : e.which;
    if (running === true) {
      if (keyCode == 32) {
        you += keypram;
      }
    } else {
      if (keyCode == 82) {
        running = true;
        you = 50;
        gametime = 0;
        lose = false;
        clearInterval(timeo2);
        clearInterval(timeo3);
        timer = 0;
        timer2 = 0;
        progressbar.style.visibility = "visible";
      }
    }
    if (blurry === true) {
      if (keyCode == 32) {
        blurry = false;
        running = true;
      }
    }
  };

  function drawwin() {
    c.height = window.innerHeight;
    c.width = document.body.clientWidth;
    ctx.putImageData(imagedata, 0, 0);
    progressbar.style.visibility = "hidden";
    let hup = 200;
    if (blue === true) {
      ctx.beginPath();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
    }
    let fontsize = 10;
    let text = wins;
    text = epicWin.concat(text);
    ctx.fillStyle = "#ff0";
    ctx.font = "800 " + fontsize + "px 'Andale Mono'";
    for (let i = 0; i < text.length; i++) {
      let measured = ctx.measureText(text[i]);
      ctx.fillText(
        text[i],
        (c.width - measured.width) / 2,
        (c.height - fontsize * text.length - hup) / 2 + fontsize * i
      );
    }
    ctx.font = "300 " + fontsize * 2 + "px 'Andale Mono'";
    ctx.fillText(
      "Press r to play again",
      (c.width - ctx.measureText("Press r to play again").width) / 2,
      (c.height + fontsize * text.length - (hup - 10)) / 2
    );
    ctx.fillText(
      "Your score: " + gametime,
      (c.width - ctx.measureText("Your score: " + gametime).width) / 2,
      (c.height + fontsize * text.length - (hup - 30) + fontsize * 2) / 2
    );
    timeo2 = setTimeout(clear, 1000);
  }
  function drawlose() {
    c.height = window.innerHeight;
    c.width = document.body.clientWidth;
    ctx.putImageData(imagedata, 0, 0);
    progressbar.style.visibility = "hidden";
    let hup = 200;
    ctx.beginPath();
    ctx.globalCompositeOperation = "color";
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.beginPath();
    ctx.globalCompositeOperation = "source-over";

    if (blue === true) {
      ctx.beginPath();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
    }
    let fontsize = 10;

    let text = loses;
    text = epicWin.concat(text);
    ctx.fillStyle = "#ff0";
    ctx.font = "800 " + fontsize + "px 'Andale Mono'";
    for (let i = 0; i < text.length; i++) {
      let measured = ctx.measureText(text[i]);
      ctx.fillText(
        text[i],
        (c.width - measured.width) / 2,
        (c.height - fontsize * text.length - hup) / 2 + fontsize * i
      );
    }
    ctx.font = "300 " + fontsize * 2 + "px 'Andale Mono'";
    ctx.fillText(
      "Press r to play again",
      (c.width - ctx.measureText("Press r to play again").width) / 2,
      (c.height + fontsize * text.length - (hup - 10)) / 2
    );
    timeo2 = setTimeout(clear, 1000);
  }
  function clear() {
    c.height = window.innerHeight;
    c.width = document.body.clientWidth;
    ctx.putImageData(imagedata, 0, 0);

    if (lose === true) {
      ctx.beginPath();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "red";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
    }
    if (blue === true) {
      ctx.beginPath();
      ctx.globalCompositeOperation = "color";
      ctx.fillStyle = "blue";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.beginPath();
      ctx.globalCompositeOperation = "source-over";
    }
    if (lose === false) {
      timeo3 = setTimeout(drawwin, 1000);
    } else {
      timeo3 = setTimeout(drawlose, 1000);
    }
  }

  function animloop() {
    timer++;
    timer2++;
    let random = Math.floor(Math.random() * (30 + 20) + 20);
    if (timer == speed) {
      timer = 0;
      progress = you;
      if (running === true) {
        draw();
        gametime++;
      }
      progressbar.value = progress;
    }

    if (you >= 100) {
      if (running === true) {
        running = false;
        drawwin();
      }
    }
    if (you <= 0) {
      if (running === true) {
        running = false;
        lose = true;
        drawlose();
      }
    }
    if (running === true) {
      if (timer2 >= random) {
        you -= keypram;
        timer2 = 0;
      }
    }
    requestAnimationFrame(animloop);
  }
  animloop();
}
export const CharacterType = () => {
  let c: HTMLCanvasElement;
  let progressbar: HTMLProgressElement;

  onMount(() => {
    main(c, progressbar);
  });

  return (
    <>
      <progress value="20" max="100" ref={progressbar!}></progress>
      <canvas width={window.innerWidth} height={window.innerHeight} ref={c!} />
    </>
  );
};
