import { onMount } from "solid-js";

let mouse = {
  x: 0.5,
  y: 0.5,
};
let hexR = 10;
let white = false;
function twhite() {
  white = !white;
}

const draw = (canvas: HTMLCanvasElement, slider: HTMLInputElement) => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let gl = canvas.getContext("webgl", { preserveDrawingBuffer: true })!;
  let vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(
    fragmentShader,
    `
//copied from http://glslsandbox.com/e#21245.3
precision highp float;
uniform float time;
uniform float msize;
uniform float white;
uniform float hexR;
uniform vec2 mouse;
uniform vec2 resolution;
uniform sampler2D backbuffer;
const float primaryNodeW = 1.;
const float secondaryNodeW = .33;
const float lKeepAlive = 1.9;
const float uKeepAlive = 3.3;
const float lBirth = 2.1;
const float hBirth = 3.2;

#define PI 3.14159265359
#define TAU 6.28318530718
#define deg60 1.0471975512
#define deg30 0.52359877559
vec2 nearestHex(vec2 st) {
    float h = sin(deg30) * hexR;
    float r = cos(deg30) * hexR;
    float b = hexR + 2. * h;
    float a = 2. * r;
    float m = h / r;
    vec2 sect = st / vec2(2. * r, h + hexR);
    vec2 sectPxl = mod(st, vec2(2. * r, h + hexR));
    float aSection = mod(floor(sect.y), 2.);
    vec2 coord = floor(sect);
    if (aSection > .0) {
        if (sectPxl.y < (h - sectPxl.x * m)) {
            coord -= 1.;
        } else if (sectPxl.y < (-h + sectPxl.x * m)) {
            coord.y -= 1.;
        }
    } else {
        if (sectPxl.x > r) {
            if (sectPxl.y < (2. * h - sectPxl.x * m)) {
                coord.y -= 1.;
            }
        } else {
            if (sectPxl.y < (sectPxl.x * m)) {
                coord.y -= 1.;
            } else {
                coord.x -= 1.;
            }
        }
    }
    float xoff = mod(coord.y, 2.) * r;
    return vec2(coord.x * 2. * r - xoff, coord.y * (h + hexR)) + vec2(r * 2., hexR);
}
float maxNorm(vec3 x) {
    return max(x.x, max(x.y, x.z));
}
vec2 neighbourHex(vec2 x, float d, int i) {
    return x - 2. * d * vec2(cos(float(i) * deg60), sin(float(i) * deg60));
}
void main(void) {
    vec3 col = vec3(0.);
    vec2 hexCoord = nearestHex(gl_FragCoord.xy);
    float p = 0.;
    for (int i = 0; i < 6; i++) {
        vec2 n1 = neighbourHex(hexCoord, hexR, i);
        vec3 nc1 = texture2D(backbuffer, n1 / resolution.xy).rgb;
        if (nc1.b != white) {
            p += primaryNodeW;
            col += primaryNodeW * nc1;
        }
        vec2 n2 = neighbourHex(n1, hexR, i + 1);
        vec3 nc2 = texture2D(backbuffer, n2 / resolution.xy).rgb;
        if (nc2.b != white) {
            p += secondaryNodeW;
            col += secondaryNodeW * nc2;
        }
    }
    vec3 selfcol = texture2D(backbuffer, hexCoord / resolution.xy).rgb;
    if(selfcol.b != white && (lKeepAlive <= p) && (p <= uKeepAlive)) col = selfcol;
    else if((lBirth <= p) && (p <= hBirth)) col = col;
    else col = vec3(white);
    vec2 position = hexCoord / resolution.xy;
    if (distance(resolution.xy * mouse, hexCoord) <= msize) col = vec3(0.5+0.5*sin(0.01*hexCoord.x+0.2*time),0.5+0.5*sin(0.01*hexCoord.y+0.3*time),0.5); //vec3(-(white-1.));
    col /= maxNorm(col);
    gl_FragColor = vec4(col, 1.);
}`
  );
  gl.shaderSource(
    vertexShader,
    `
precision mediump float;
      attribute vec2 vertPosition;
      void main() {
          gl_Position = vec4(vertPosition, .0, 1.);
      }`
  );
  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);
  let program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  let triangleVertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, 1, 1, -1, 1]);
  let t1 = createTarget(window.innerWidth, window.innerHeight);
  let t2 = createTarget(window.innerWidth, window.innerHeight);
  let resolution = gl.getUniformLocation(program, "resolution");
  let ptime = gl.getUniformLocation(program, "time");
  let pmouse = gl.getUniformLocation(program, "mouse");
  let msize = gl.getUniformLocation(program, "msize");
  let pwhite = gl.getUniformLocation(program, "white");
  let phexR = gl.getUniformLocation(program, "hexR");
  let backbuffer = gl.getUniformLocation(program, "backbuffer");
  let position = gl.getAttribLocation(program, "vertPosition");
  function render(time: number) {
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t2.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, t1.framebuffer);
    gl.uniform1f(ptime, time / 1000);
    gl.uniform1f(pwhite, +white);
    gl.uniform1f(msize, +slider.value * 20);
    gl.uniform1f(phexR, hexR);
    gl.uniform2f(resolution, window.innerWidth, window.innerHeight);
    gl.uniform2f(pmouse, mouse.x, 1 - mouse.y);
    gl.uniform1i(backbuffer, 0);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, t1.texture);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniform1i(backbuffer, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    [t1, t2] = [t2, t1];
    window.requestAnimationFrame(render);
  }
  window.requestAnimationFrame(render);

  window.onmousemove = (e) => {
    mouse.x = e.clientX / window.innerWidth;
    mouse.y = e.clientY / window.innerHeight;
  };
  window.onresize = () => {
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    t1 = createTarget(window.innerWidth, window.innerHeight);
    t2 = createTarget(window.innerWidth, window.innerHeight);
  };
  window.onwheel = (e: WheelEvent) => {
    e.preventDefault();
    let delta = -e.deltaY;
    e.preventDefault();

    delta = Math.max(-1, Math.min(1, delta));
    if ((hexR < 20 && delta < 0) || (hexR > 1 && delta > 0)) hexR -= delta;
  };
  function createTarget(width: number, height: number) {
    let target = {
      framebuffer: gl.createFramebuffer(),
      renderbuffer: gl.createRenderbuffer(),
      texture: gl.createTexture(),
    };
    gl.bindTexture(gl.TEXTURE_2D, target.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.framebuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, target.texture, 0);
    gl.bindRenderbuffer(gl.RENDERBUFFER, target.renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, target.renderbuffer);
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return target;
  }
};

export const HexLife = () => {
  let c: HTMLCanvasElement;
  let slider: HTMLInputElement;
  onMount(() => {
    draw(c, slider);
  });
  return (
    <>
      <div class="well">
        <button
          class="btn btn-primary"
          onclick={() => {
            document.body.classList.toggle("white");
            twhite();
          }}
          style="left: 10px; top: 5px; height: 30; padding: 5px"
        >
          Toggle Theme
        </button>
        <input
          type="range"
          id="slider"
          max="10"
          min="1"
          value="1"
          style="display: initial; margin: 0; width: 400px"
          ref={slider!}
        />
      </div>
      <canvas id="shader" ref={c!}></canvas>
    </>
  );
};
