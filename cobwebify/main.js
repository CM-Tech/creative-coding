var input = document.getElementById("tex");
var c = document.getElementById("c");
var ctx = c.getContext("2d");
var size = {
  w: window.innerWidth,
  h: window.innerHeight,
};
var balls = [];
var rays = [];
var ballRays = [];
function line(x, y, x2, y2) {
  this.x1 = x;
  this.y1 = y;
  this.x2 = x2;
  this.y2 = y2;
  return this;
}
function ball(x, y) {
  this.x = x;
  this.y = y;
  this.vx = 0;
  this.vy = 0;
  this.fx = 0;
  this.fy = 0;
  this.move = function () {
    this.x += this.fx;
    this.y += this.fy;
    this.vy += 0.5;
    if (this.y + 20 > size.h) {
      this.y = size.h - 20;
      this.vy = -Math.abs(this.vy) * 0.5;
    }
    if (this.x + 20 > size.w) {
      this.x = size.w - 20;
      this.vx = -Math.abs(this.vx) * 0.5;
    }
    if (this.x - 20 < 0) {
      this.x = 20;
      this.vx = Math.abs(this.vx) * 0.5;
    }
    this.x += this.vx;
    this.y += this.vy;
    this.vx = this.vx * 0.95;
    this.vy = this.vy * 0.95;
    this.fx = 0;
    this.fy = 0;
  };
  return this;
}
var pixels = [];
var ballPixels = [];
var edgePoints = [];
var ballPoints = [];
c.width = size.w;
c.height = size.h;
for (var i = 0; i < 10; i++)
  balls.push(new ball(Math.random() * size.w, Math.random() * size.h));
input.value = "Cobwebify is Amazing";
var raylength = 20; //distance before ray is destroyed
var cpp = 3; //amount of times a pixel should send a ray
var textSize = 100;
function fragmentText(text, maxWidth) {
  var words = text.split(" "),
    lines = [],
    line = "";
  if (ctx.measureText(text).width < maxWidth) return [text];
  while (words.length > 0) {
    while (ctx.measureText(words[0]).width >= maxWidth) {
      var tmp = words[0];
      words[0] = tmp.slice(0, -1);
      if (words.length > 1) words[1] = tmp.slice(-1) + words[1];
      else words.push(tmp.slice(-1));
    }
    if (ctx.measureText(line + words[0]).width < maxWidth)
      line += words.shift() + " ";
    else {
      lines.push(line);
      line = "";
    }
    if (words.length === 0) lines.push(line);
  }
  return lines;
}
function raycast(x, y) {
  var dirX = Math.random();
  dirX < 0.5 && (dirX = -dirX);
  var dirY = Math.random() * 2 - 1;
  var cX = x;
  var cY = y;
  for (var i = 0; i < raylength; i++) {
    cX += dirX;
    cY += dirY;
    if (
      Math.floor(cY) > 0 &&
      Math.floor(cY) < pixels.length &&
      Math.floor(cX) > 0 &&
      Math.floor(cX) < pixels[0].length
    ) {
      if (pixels[Math.floor(cY)][Math.floor(cX)]) {
        drawLine(x, y, cX, cY, rays);
        return true; //indicates hit
      }
    }
  }
}
function raycastBall(x, y) {
  var dirX = Math.random();
  dirX < 0.5 && (dirX = -dirX);
  var dirY = Math.random() * 2 - 1;
  var cX = x;
  var cY = y;
  for (var i = 0; i < raylength; i++) {
    cX += dirX;
    cY += dirY;
    if (
      Math.floor(cY) > 0 &&
      Math.floor(cY) < pixels.length &&
      Math.floor(cX) > 0 &&
      Math.floor(cX) < pixels[0].length
    ) {
      if (
        pixels[Math.floor(cY)][Math.floor(cX)] ||
        ballPixels[Math.floor(cY)][Math.floor(cX)]
      ) {
        drawLine(x, y, cX, cY, ballRays);
        return true; //indicates hit
      }
    }
  }
}
function setupPixels(txt) {
  ctx.clearRect(0, 0, size.w, size.h);
  ctx.beginPath();
  ctx.font = "100px Arial";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.textAlign = "center";
  txt.forEach(function (line, i) {
    ctx.strokeText(line, size.w / 2, (i + 1) * 100 + 60);
  });
  if (pixels.length === 0) {
    pixels = [];
    var ctext = ctx.getImageData(0, 0, size.w, size.h);
    var pixtext = ctext.data;
    for (var i = 0; i < pixtext.length; i += 4) {
      //make row
      if ((i / 4) % size.w === 0) {
        pixels[Math.floor(i / 4 / size.w)] = [];
      }
      // having inequality over half opacity gives
      //best result because of antialising
      if (255 / 2 < pixtext[i + 3]) {
        edgePoints.push({
          x: (i / 4) % size.w,
          y: Math.floor(i / 4 / size.w),
        });
        pixels[Math.floor(i / 4 / size.w)][(i / 4) % size.w] = true;
      } else {
        pixels[Math.floor(i / 4 / size.w)][(i / 4) % size.w] = false;
      }
    }
  }
  ctx.clearRect(0, 0, size.w, size.h);
  for (var i = 0; i < balls.length; i++) {
    ctx.beginPath();
    ctx.arc(balls[i].x, balls[i].y, 20, 0, Math.PI * 2, true);
    ctx.stroke();
  }
  ballPixels = [];
  ballPoints = [];
  ballRays = [];
  var cball = ctx.getImageData(0, 0, size.w, size.h);
  var pixball = cball.data;
  for (var i = 0; i < pixball.length; i += 4) {
    //make row
    if ((i / 4) % size.w === 0) {
      ballPixels[Math.floor(i / 4 / size.w)] = [];
    }
    // having inequality over half opacity gives
    //best result because of antialising
    if (255 / 2 < pixball[i + 3]) {
      ballPoints.push({
        x: (i / 4) % size.w,
        y: Math.floor(i / 4 / size.w),
      });
      ballPixels[Math.floor(i / 4 / size.w)][(i / 4) % size.w] = true;
    } else {
      ballPixels[Math.floor(i / 4 / size.w)][(i / 4) % size.w] = false;
    }
  }
  //redraw text
  ctx.beginPath();
  ctx.font = "100px Arial";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "white";
  ctx.textAlign = "center";
  txt.forEach(function (line, i) {
    ctx.strokeText(line, size.w / 2, (i + 1) * 100 + 60);
  });
}
function tick() {
  //collide
  for (var i = 0; i < balls.length; i++) {
    for (var j = i + 1; j < balls.length; j++) {
      var dx = balls[j].x - balls[i].x;
      var dy = balls[j].y - balls[i].y;
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 40) {
        var force = 0.5 / (dist / 20);
        balls[j].fx += dx * force;
        balls[i].fx += -dx * force;
        balls[j].fy += dy * force;
        balls[i].fy += -dy * force;
      }
    }
  }
  //move
  for (var i = 0; i < balls.length; i++) balls[i].move();
  key();
}
window.setInterval(tick, 1);
function drawLine(x, y, x1, y1, arr) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  arr && arr.push(new line(x, y, x1, y1));
}
function setup(txt) {
  //create an array of pixels witht the bodrer of the text
  setupPixels(fragmentText(txt, size.w));
  if (rays.length === 0) {
    for (var i = 0; i < 0.5 * edgePoints.length; i++) {
      var edgePoint = edgePoints[Math.floor(Math.random() * edgePoints.length)];
      for (var j = 0; j < cpp; j++) var hit = raycast(edgePoint.x, edgePoint.y);
    }
  } else {
    for (var i = 0; i < ballPoints.length * cpp; i++) {
      var ballPoint = ballPoints[i % (ballPoints.length - 1)];
      var hit = raycastBall(ballPoint.x, ballPoint.y);
    }
    for (var i = 0; i < ballRays.length; i++) {
      var ray = ballRays[i];
      drawLine(ray.x1, ray.y1, ray.x2, ray.y2);
    }
    for (var i = 0; i < rays.length; i++) {
      var ray = rays[i];
      drawLine(ray.x1, ray.y1, ray.x2, ray.y2);
    }
  }
}
setup(input.value);
function key() {
  pixels = [];
  edgePoints = [];
  ctx.clearRect(0, 0, size.w, size.h);
  setup(input.value);
}
function change() {
  rays = [];
  key();
}
input.onkeyup = change;
input.onchange = change;
window.onresize = function () {
  size.w = window.innerWidth;
  size.h = window.innerHeight;
  c.width = size.w;
  c.height = size.h;
  change();
};
