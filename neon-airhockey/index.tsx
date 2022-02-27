import { onMount } from "solid-js";
import frag from "./frag.glsl?raw";

function main(canvas: HTMLCanvasElement) {
  const vertex = `
precision mediump float;
attribute vec2 vertPosition;
void main() {
    gl_Position = vec4(vertPosition, 0.0, 1.0);
}
`;

  let mouse = {
    x: 0.5,
    y: 0.5,
  };
  let down = 0.0;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  let gl = canvas.getContext("webgl")!;

  let vertexShader = gl.createShader(gl.VERTEX_SHADER)!;
  let fragmentShader = gl.createShader(gl.FRAGMENT_SHADER)!;

  gl.shaderSource(vertexShader, vertex);
  gl.shaderSource(fragmentShader, frag);

  gl.compileShader(vertexShader);
  gl.compileShader(fragmentShader);

  let program = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  let triangleVertices = new Float32Array([
    -1.0, -1.0, 1.0, -1.0, -1.0, 1.0,

    1.0, -1.0, 1.0, 1.0, -1.0, 1.0,
  ]);

  let t1 = createTarget(window.innerWidth, window.innerHeight);
  let t2 = createTarget(window.innerWidth, window.innerHeight);

  let ptime = gl.getUniformLocation(program, "time");
  let presolution = gl.getUniformLocation(program, "resolution");
  let pmouse = gl.getUniformLocation(program, "mouse");
  let pbackbuffer = gl.getUniformLocation(program, "backbuffer");
  let pdown = gl.getUniformLocation(program, "down");
  let pposition = gl.getAttribLocation(program, "vertPosition");

  function render(time: number) {
    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, t2.texture);

    gl.bindFramebuffer(gl.FRAMEBUFFER, t1.framebuffer);

    gl.uniform1f(pdown, down);
    gl.uniform1f(ptime, time / 1000);
    gl.uniform2f(presolution, window.innerWidth, window.innerHeight);
    gl.uniform2f(pmouse, mouse.x, 1 - mouse.y);
    gl.uniform1i(pbackbuffer, 0);

    gl.enableVertexAttribArray(pposition);
    gl.vertexAttribPointer(pposition, 2, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);

    gl.useProgram(program);

    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, triangleVertices, gl.STATIC_DRAW);

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, t1.texture);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.uniform1i(pbackbuffer, 0);

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
  window.onmousedown = () => {
    down = 1.0;
  };
  window.onmouseup = () => {
    down = 0.0;
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
  render(0);
}
export const NeonAirhockey = () => {
  let c: HTMLCanvasElement;
  onMount(() => {
    main(c);
  });
  return <canvas ref={c!} />;
};
