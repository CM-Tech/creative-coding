import * as dat from "dat.gui";
import * as d3 from "d3";
import { QuadtreeInternalNode, QuadtreeLeaf } from "d3";
import { createSignal, onMount } from "solid-js";
import { createAnimationFrame } from "../utils";

const [filter, setFilter] = createSignal("");
function main(c: HTMLCanvasElement, audio: HTMLAudioElement) {
  let ctx = c.getContext("2d")!,
    w = window.innerWidth,
    h = window.innerHeight;

  class BoidBeat {
    speed = 1;
    directions = 6;
    turning = true;
    lineWidth = 1;
    song = window.location.hash.slice(1) ? "/#" + window.location.hash.slice(1) : "/#300-Violin-Orchestra";
    tThreshold = 0.3;
  }

  let freqCount = 256;
  function getRMS(spectrum: Uint8Array) {
    let rms = 0;
    for (let i = 0; i < spectrum.length; i++) {
      rms += spectrum[i] * spectrum[i];
    }
    rms /= spectrum.length;
    rms = Math.sqrt(rms);
    return rms;
  }

  function songchange(value: string) {
    window.location.hash = value.split("#").pop()!;
  }
  function hashchange() {
    audio.src = "/sounds/" + window.location.hash.slice(1) + ".mp3";
    audio.classList.add("paused");
  }

  let controls = new BoidBeat();
  function gui() {
    let gui = new dat.GUI();
    gui
      .add(controls, "song", {
        "Glorious Morning": "/#Glorious_morning",
        Jumper: "/#Jumper",
        Stride: "/#Stride-",
        "300 Violin Orchestra": "/#300-Violin-Orchestra",
        "ThunderZone v2": "/#ThunderZone-v2",
        "Portugal The Man - Feel it Still": "/#Feel-it-Still",
        "The XX - Intro": "/#XX-Intro",
        "Hall of the Mountain King": "/#Hall-of-the-Mountain-King",
        'Everybody Wants To Rule The World (7" Version)': "/#Everybody-wants-to-rule-the-world",
        Flight: "/#Flight",
        "Electroman Adventures V2": "/#Electroman-Adventures",
        Rasputin: "/#Rasputin",
      })
      .onChange(songchange);
    gui.add(controls, "speed", 0.125, 2);
    gui.add(controls, "lineWidth", 1, 10);
    gui.add(controls, "tThreshold", 0.01, 0.99);

    gui.add(controls, "directions", 2, 12);
    gui.add(controls, "turning");
  }
  let baseRad = Math.max(Math.min(w, h) / 200, 4);

  let effectiveF = 16;
  let trailSteps = 20;
  let fastestTurnFreq = 10;
  let q = 0;
  let ncount = (w * h) / baseRad / 500;
  let scales = Math.log2(freqCount);
  function logNt(v: number) {
    return Math.log(v + 1) / Math.log(2) / (Math.log(freqCount + 1) / Math.log(2));
  }
  let nodes = d3.range(ncount).map(() => {
    let f = Math.floor((q / ncount) * effectiveF);

    let m = {
      radius: baseRad,
      vx: Math.random() * 12 - 6,
      vy: Math.random() * 12 - 6,
      x: (f / effectiveF) * w,
      y: Math.random() * h,
      ax: 0,
      ay: 0,
      fx: 0,
      fy: 0,
      aveCenterX: 0,
      aveCenterY: 0,
      aveVX: 0,
      aveVY: 0,
      totalNebs: 0,
      vol: 0,
      volav: 0,
      freq: Math.floor(f),
      nt: logNt(Math.floor(f)),
      lastTurn: 0,
      axl: [] as number[],
      ayl: [] as number[],
      btr: [] as number[],
      posHist: [] as { x: number; y: number }[],
    };
    m.axl = [m.x];
    m.ayl = [m.y];
    m.posHist = [{ x: m.x, y: m.y + 0 }];
    m.btr = [0];
    q++;
    return m;
  });
  for (let i = 1; i < nodes.length; i++) {
    nodes[i].ax = nodes[i].x;
    nodes[i].ay = nodes[i].y;
  }

  if (window.location.hash) hashchange();
  window.addEventListener("hashchange", hashchange);
  let audioCtx = new window.AudioContext();
  let analyser = audioCtx.createAnalyser();
  analyser.connect(audioCtx.destination);

  analyser.fftSize = freqCount * 2;
  analyser.smoothingTimeConstant = 0.2;

  let bpm = 240;

  let hM = 100;
  let historyLength = Math.floor((60 * 1000) / bpm / (1000 / 60)) * hM;
  let musica: number[] = [];
  let musicmxl: number[] = [];
  for (let i = 0; i < freqCount; i++) {
    musica.push(0);
    musicmxl.push(0);
  }
  let musics: Uint8Array[] = [];
  for (let i = 0; i < historyLength; i++) {
    let music2 = new Uint8Array(freqCount);
    musics.push(music2);
  }
  let ll = 0;
  let music = new Uint8Array(freqCount);

  createAnimationFrame(() => {
    ll++;

    analyser.getByteFrequencyData(music);

    for (let i = 0; i < 0; i++) {
      music = music.map((x, i) => {
        let l = [x];
        if (i < freqCount - 1) {
          l.push(music[i + 1]);
        }
        if (i > 0) {
          l.push(music[i - 1]);
        }
        return Math.max(...l);
      });
    }
    musics.unshift(music.slice());
    musics.pop();
    let musicave = [];
    for (let i = 0; i < freqCount; i++) {
      musica[i] = 0;
      musicmxl[i] = 0;
      musicave[i] = 0;
      for (let j = 0; j < historyLength / hM; j++) {
        musica[i] = Math.max(musics[j][i], musica[i]); ///historyLength;

        musicave[i] += (musics[j][i] / historyLength) * hM;
      }
      for (let j = 0; j < historyLength; j++) {
        musicmxl[i] = Math.max(musics[j][i], musicmxl[i]); ///historyLength;
      }
    }

    if (w != window.innerWidth || h != window.innerHeight) {
      w = window.innerWidth;
      h = window.innerHeight;
    }
    let q = d3.quadtree(nodes),
      i = 0,
      n = nodes.length;
    for (i = 0; i < n; i++) {
      nodes[i].fx = 0;
      nodes[i].fy = 0;
      nodes[i].aveCenterX = 0;
      nodes[i].aveCenterY = 0;
      nodes[i].aveVX = 0;
      nodes[i].aveVY = 0;
      nodes[i].totalNebs = 0;
      let inter = 1 - Math.pow(Math.random(), 1);
      let randF = Math.floor(Math.random() * freqCount * (1 - inter) + nodes[i].freq * inter);
      if (musicmxl[randF] / 256 > (musicmxl[nodes[i].freq] / 256) * 10.0) {
        nodes[i].freq = Math.max(Math.min(randF + Math.floor(Math.random() * 0), freqCount - 1), 0);
        nodes[i].nt = logNt(Math.floor(nodes[i].freq));
      }
    }
    nodes.sort((a, b) => a.freq - b.freq);

    i = 0;
    while (++i < n) {
      q.visit(collide(nodes[i]));
    }
    for (i = 1; i < n; i++) {
      nodes[i].fx += nodes[i].vx / 4;
      nodes[i].fy += nodes[i].vy / 4;
      if (nodes[i].totalNebs > 0) {
        nodes[i].fx += nodes[i].aveVX / nodes[i].totalNebs - nodes[i].vx / nodes[i].totalNebs;
        nodes[i].fy += nodes[i].aveVY / nodes[i].totalNebs - nodes[i].vy / nodes[i].totalNebs;
        nodes[i].fx += (nodes[i].aveCenterX / nodes[i].totalNebs - nodes[i].x) / 40;
        nodes[i].fy += (nodes[i].aveCenterY / nodes[i].totalNebs - nodes[i].y) / 40;
      }
      let fL = Math.sqrt(nodes[i].fx * nodes[i].fx + nodes[i].fy * nodes[i].fy);
      if (fL === 0) {
        fL = 1;
        let randDir = Math.random() * Math.PI * 2;

        nodes[i].fx = Math.cos(randDir) * 1;
        nodes[i].fy = Math.sin(randDir) * 1;
      }
      let min = nodes[i].radius / 5;
      let max = nodes[i].radius * 1;
      nodes[i].vx = (nodes[i].fx / fL) * Math.min(Math.max(min, fL), max);
      nodes[i].vy = (nodes[i].fy / fL) * Math.min(Math.max(min, fL), max);
      let volume = Math.pow(music[nodes[i].freq] / 256, 10.0);

      let spdm = Math.pow(music[nodes[i].freq] / 256, 4) + 0.25; //(volume*0.5+(music[nodes[i].freq]*2.0+16)/(musicave[nodes[i].freq]+128));//1.0;//volume/10+0.9;
      let ddir = controls.directions;
      let spd = (Math.sqrt(nodes[i].vx * nodes[i].vx + nodes[i].vy * nodes[i].vy) / 3) * spdm * controls.speed * 2.0;
      let hdir = (Math.round((Math.atan2(nodes[i].vy, nodes[i].vx) / Math.PI / 2) * ddir) / ddir) * Math.PI * 2;
      if ("/#XX-Intro" == controls.song) {
        ddir = 4;
        spd = (Math.sqrt(nodes[i].vx * nodes[i].vx + nodes[i].vy * nodes[i].vy) / 3) * spdm * controls.speed * 2.0;
        hdir =
          ((Math.round((Math.atan2(nodes[i].vy, nodes[i].vx) / Math.PI / 2) * ddir + 0.5) - 0.5) / ddir) * Math.PI * 2;
      }
      let vxh = Math.cos(hdir) * spd;
      let vyh = Math.sin(hdir) * spd;
      nodes[i].x += vxh;
      nodes[i].y += vyh;
      bound(nodes[i]);

      let thrrr = controls.tThreshold;
      if (
        volume > thrrr &&
        musics[5][nodes[i].freq] == musica[nodes[i].freq] &&
        nodes[i].lastTurn > fastestTurnFreq &&
        controls.turning
      ) {
        let hdird = Math.atan2(nodes[i].vy, nodes[i].vx) + ((Math.PI * 2) / ddir) * ((ll % 2) * 2 - 1);

        nodes[i].vx = Math.cos(hdird) * spd;
        nodes[i].vy = Math.sin(hdird) * spd;
        nodes[i].lastTurn = 0;
      }

      spd = Math.sqrt(nodes[i].vx * nodes[i].vx + nodes[i].vy * nodes[i].vy) * spdm * controls.speed;
      hdir = (Math.round((Math.atan2(nodes[i].vy, nodes[i].vx) / Math.PI / 2) * ddir) / ddir) * Math.PI * 2;
      if ("/#XX-Intro" == controls.song) {
        ddir = 4;
        spd = (Math.sqrt(nodes[i].vx * nodes[i].vx + nodes[i].vy * nodes[i].vy) / 3) * spdm * controls.speed * 2.0;
        hdir =
          ((Math.round((Math.atan2(nodes[i].vy, nodes[i].vx) / Math.PI / 2) * ddir + 0.5) - 0.5) / ddir) * Math.PI * 2;
      }
      vxh = Math.cos(hdir) * spd;
      vyh = Math.sin(hdir) * spd;
      nodes[i].x += vxh;
      nodes[i].y += vyh;
      nodes[i].ax += (nodes[i].x - nodes[i].ax) * 1.0;
      nodes[i].ay += (nodes[i].y - nodes[i].ay) * 1.0;
      nodes[i].lastTurn += 1;
    }

    ctx.globalCompositeOperation = "subtract";
    ctx.fillStyle = "rgba(5,5,5,1)";
    ctx.rect(0, 0, w, h);
    ctx.fill();
    if ("/#XX-Intro" == controls.song) {
      setFilter("sepia(0.8) hue-rotate(180deg) saturate(2)");
      let v = getRMS(music);
      let sso = Math.min(w, h) / 8;
      let ss = ((v / 256) * sso) / 2 + sso / 2;
      ctx.globalCompositeOperation = "lighter";
      ctx.lineWidth = (ss - sso / 2) * Math.sqrt(2);
      ctx.strokeStyle = `hsl(0,0%,${(v / 256) * 100}%)`;
      ctx.fillStyle = `hsl(0,0%,${0}%)`;

      ctx.beginPath();
      ctx.moveTo(w / 2 - ss, h / 2);
      ctx.lineTo(w / 2 - ss * 3, h / 2 - ss * 2);
      ctx.lineTo(w / 2 - ss * 2, h / 2 - ss * 3);
      ctx.lineTo(w / 2 - ss * 0, h / 2 - ss * 1);
      ctx.lineTo(w / 2 + ss * 2, h / 2 - ss * 3);
      ctx.lineTo(w / 2 + ss * 3, h / 2 - ss * 2);
      ctx.lineTo(w / 2 + ss * 1, h / 2 - ss * 0);

      ctx.lineTo(w / 2 + ss * 3, h / 2 + ss * 2);
      ctx.lineTo(w / 2 + ss * 2, h / 2 + ss * 3);
      ctx.lineTo(w / 2 + ss * 0, h / 2 + ss * 1);
      ctx.lineTo(w / 2 - ss * 2, h / 2 + ss * 3);
      ctx.lineTo(w / 2 - ss * 3, h / 2 + ss * 2);

      ctx.closePath();

      ctx.stroke();
      ctx.fill();
    } else {
      setFilter("");
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "gray";
    for (let i of nodes) {
      let volume = Math.pow(music[i.freq] / 256, 5.0);
      let volume3 = Math.pow(musicave[i.freq] / 256, 5.0);

      let vFall = 0.95;
      i.vol = Math.max(volume, (i.vol || 0) * vFall);
      i.volav = Math.max(volume3 / 2 + volume / 3, (i.volav || 0) * vFall);
    }

    //weird optimized v rendering
    for (let i of nodes) {
      i.axl.unshift(i.ax + 0);
      i.ayl.unshift(i.ay + 0);

      i.btr.unshift(i.vol);
      if (i.axl.length > trailSteps) {
        i.axl = i.axl.slice(0, trailSteps);
      } else {
        i.axl.push(i.axl[0]);
      }
      if (i.btr.length > trailSteps) {
        i.btr = i.btr.slice(0, trailSteps);
      }
      i.posHist.unshift({ x: i.ax, y: i.ay });

      if (i.posHist.length > trailSteps) {
        i.posHist = i.posHist.slice(0, trailSteps);
      }
      if (i.ayl.length > trailSteps) {
        i.ayl = i.ayl.slice(0, trailSteps);
      } else {
        i.ayl.push(i.ayl[0]);
      }
      for (let ko = i.axl.length - 1; ko > 0; ko--) {
        i.axl[ko] = i.axl[ko] + (Math.random() * 2 - 1) * 1;
        i.ayl[ko] = i.ayl[ko] + (Math.random() * 2 - 1) * 1;
      }
    }
    ctx.lineWidth = controls.lineWidth;

    for (let ko = 0; ko < nodes[1].posHist.length; ko++) {
      let k = nodes[1].posHist.length - ko - 1;
      // let firstN=true;
      let lastN = -1;
      for (let i of nodes) {
        let bri = i.vol * Math.pow(Math.max(Math.min(i.vol - k / (i.posHist.length - 1), 1), 0), 0.25);
        let lastp = { x: i.ax, y: i.ay };
        if (k > 0) {
          lastp = i.posHist[k - 1];
        }
        if (lastN !== i.freq) {
          if (lastN != -1) {
            ctx.stroke();
          }
          lastN = i.freq;
          ctx.beginPath();

          ctx.lineCap = "round";
          ctx.strokeStyle = `hsla(${((i.freq / freqCount) * scales * 360 * 3) % 360},${Math.floor(
            bri * 50 + 50
          )}%,${50}%,${Math.floor(bri * 100)}%)`;
        }

        ctx.moveTo(lastp.x, lastp.y);
        ctx.lineTo(i.posHist[k].x, i.posHist[k].y);
      }
      ctx.stroke();
    }
  });

  function bound(node: typeof nodes[number]) {
    let r = node.radius;
    let nx = Math.max(node.x, r);
    let ny = Math.max(node.y, r);
    nx = Math.min(nx, w - r);
    ny = Math.min(ny, h - r);

    node.vx += nx - node.x;
    node.vy += ny - node.y;
    node.vx += nx - node.x;
    node.vy += ny - node.y;
  }

  type Node = typeof nodes[number];
  function collide(node: Node) {
    let r = node.radius * 18,
      nx1 = node.x - r,
      nx2 = node.x + r,
      ny1 = node.y - r,
      ny2 = node.y + r;
    return (n2: QuadtreeInternalNode<Node> | QuadtreeLeaf<Node>, x1: number, y1: number, x2: number, y2: number) => {
      if (!n2.length) {
        do {
          if (n2.data !== node) {
            let x = node.x - n2.data.x,
              y = node.y - n2.data.y,
              l = Math.sqrt(x * x + y * y),
              r = node.radius + n2.data.radius;
            if (l < r * 3) {
              let thr = 0.8;
              let attractiveness =
                Math.max(Math.pow(1 - (Math.abs(node.freq - n2.data.freq) / freqCount) * scales, 2) - thr, 0) /
                (1 - thr);
              node.totalNebs += attractiveness;
              n2.data.totalNebs += attractiveness;
              node.aveVX += n2.data.vx * attractiveness;
              n2.data.aveVX += node.vx * attractiveness;
              node.aveVY += n2.data.vy * attractiveness;
              n2.data.aveVY += node.vy * attractiveness;
              node.aveCenterX += n2.data.x * attractiveness;
              n2.data.aveCenterX += node.x * attractiveness;
              node.aveCenterY += n2.data.y * attractiveness;
              n2.data.aveCenterY += node.y * attractiveness;
              r = r * 1.5;
              if (l < r) {
                l = ((l - r) / l) * 0.5 * attractiveness;
                node.fx -= x *= l;
                node.fy -= y *= l;
                n2.data.fx += x;
                n2.data.fy += y;
              }
            }
          }
        } while ((n2 = n2.next!) && n2);
      }

      return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
    };
  }
  window.addEventListener("resize", () => {
    w = c.width = window.innerWidth;
    h = c.height = window.innerHeight;
  });
  audio.addEventListener("pause", () => {
    audio.classList.add("paused");
  });
  audio.addEventListener("play", () => {
    audioCtx.resume();
    audio.classList.remove("paused");
  });

  gui();
  const source = audioCtx.createMediaElementSource(audio);
  source.connect(analyser);
}
export const BoidBeats = () => {
  let c: HTMLCanvasElement;
  let audio: HTMLAudioElement;
  onMount(() => {
    main(c, audio);
  });

  return (
    <>
      <canvas ref={c!} width={window.innerWidth} height={window.innerHeight} style={{ filter: filter() }} />
      <audio
        ref={audio!}
        crossorigin="anonymous"
        class="paused audio"
        src="/sounds/300-Violin-Orchestra.mp3"
        loop
        controls
      ></audio>
    </>
  );
};
