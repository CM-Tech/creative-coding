import { Avoid, w, h } from ".";
import { Vec } from "./Vec";

var maxSpeed = 2;
var friendRadius = 20;
var crowdRadius = 10;
var avoidRadius = 30;
var coheseRadius = friendRadius;

export class Boid {
  pos: Vec;
  vel: Vec;
  hue: Vec;
  neighbors: Boid[];
  pointHistory: Vec[];
  hueHistory: number[];
  updateTimer: number;
  constructor(x: number, y: number) {
    this.pos = new Vec(x, y);
    this.vel = new Vec(Math.random() * 10 - 5, Math.random() * 2 - 1);
    this.hue = new Vec(
      Math.random() * Math.PI * 2 - Math.PI,
      Math.random() * Math.PI * 2 - Math.PI
    ).normalize();
    this.neighbors = [];
    this.pointHistory = [new Vec(x, y)];
    this.hueHistory = [
      (Math.atan2(this.hue.x, this.hue.y) * 180) / Math.PI + 180,
    ];
    this.updateTimer = Math.floor(Math.random() * 10);
  }

  update(boids: Boid[], avoids: Avoid[]) {
    this.updateTimer++;
    this.wrap();

    if (this.updateTimer % 5 === 0) {
      this.getNeighbors(boids);
    }
    if (this.updateTimer % 2 == 0) {
      this.pointHistory.push(this.pos.copy());
      this.pointHistory.splice(0, this.pointHistory.length - 10);

      this.hueHistory.push(
        (Math.atan2(this.hue.x, this.hue.y) * 180) / Math.PI + 180
      );
      this.hueHistory.splice(0, this.hueHistory.length - 10);
    }

    this.flock(avoids);
    this.pos.add(this.vel);
  }

  flock(avoids: Avoid[]) {
    var allign = this.getAverageDir();
    var avoidDir = this.getAvoidDir();
    var avoidObjects = this.getAvoidAvoids(avoids);
    var noise = new Vec(Math.random() * 2 - 1, Math.random() * 2 - 1);
    var cohese = this.getCohesion();

    avoidObjects.mult(10);
    noise.mult(0.5);

    this.vel.add(allign);
    this.vel.add(avoidDir);
    this.vel.add(avoidObjects);
    this.vel.add(noise);
    this.vel.add(cohese);

    this.vel.limit(maxSpeed);

    this.hue.add(this.getAverageColor().mult(0.03));
  }

  getAverageColor() {
    var randomAngle = Math.random() * Math.PI * 2;
    var total = new Vec(Math.cos(randomAngle), Math.sin(randomAngle)).mult(
      50.0
    );
    this.neighbors.map((other) => {
      total.add(other.hue);
    });
    if (!this.neighbors.length) return total.mult(0.5);
    return total.sub(this.hue).mult(0.5);
  }

  getAverageDir() {
    var sum = new Vec(0, 0);
    var count = 0;
    var myPos = this.pos;
    this.neighbors.map((other) =>{
      var d = myPos.dist(other.pos);

      if (d < friendRadius) {
        var copy = other.vel.copy();
        copy.normalize();
        copy.div(d);
        sum.add(copy);
        count++;
      }
    });
    return sum;
  }

  getAvoidDir() {
    var steer = new Vec(0, 0);
    var count = 0;
    var myPos = this.pos;
    this.neighbors.map((other) => {
      var d = myPos.dist(other.pos);
      if (d < crowdRadius) {
        var diff = myPos.copy().sub(other.pos);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
        count++; // Keep track of how many
      }
    });

    return steer;
  }

  getAvoidAvoids(avoids: Avoid[]) {
    var steer = new Vec(0, 0);
    var myPos = this.pos;
    avoids.map((other) => {
      var d = myPos.dist(other.pos);
      if (d < avoidRadius) {
        var diff = myPos.copy().sub(other.pos);
        diff.normalize();
        diff.div(d); // Weight by distance
        steer.add(diff);
      }
    });
    var cardWidth = document.getElementById("center")!.clientWidth;
    var cardHeight = document.getElementById("center")!.clientHeight;
    //console.log(cardWidth,cardHeight,w,h,document.getElementById("center"));
    /*avoid description*/
    if (Math.abs(this.pos.y - h / 2) - cardHeight / 2 < avoidRadius - 8) {
      if (Math.abs(this.pos.x - w / 2) - cardWidth / 2 < 0) {
        steer.add(new Vec(0, this.pos.y > h / 2 ? 100 : -100));
      }
    }

    if (Math.abs(this.pos.x - w / 2) - cardWidth / 2 < avoidRadius - 8) {
      if (Math.abs(this.pos.y - h / 2) - cardHeight / 2 < 0) {
        steer.add(new Vec(this.pos.x > w / 2 ? 100 : -100, 0));
      }
    }
    return steer;
  }

  getCohesion() {
    var sum = new Vec(0, 0);
    var count = 0;
    var myPos = this.pos;
    this.neighbors.map((other) => {
      var d = myPos.dist(other.pos);
      if (d < coheseRadius) {
        sum.add(other.pos); // Add location
        count++;
      }
    });
    if (count > 0) {
      sum.div(count);

      var desired = sum.sub(myPos);
      return desired.setMag(0.05);
    } else {
      return new Vec(0, 0);
    }
  }

  wrap() {
    this.pos.x = (this.pos.x + w) % w;
    this.pos.y = (this.pos.y + h) % h;
  }

  getNeighbors(boids: Boid[]) {
    var me = this;
    this.neighbors = boids.filter((bo) =>{
      if (bo == me) return false;
      return bo.pos.distSquare(me.pos) < Math.pow(friendRadius, 2);
    });
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "black";
    for (var ii = 1; ii < this.pointHistory.length; ii++) {
      ctx.beginPath();
      ctx.arc(
        this.pointHistory[ii].x,
        this.pointHistory[ii].y,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    for (var ii = 1; ii < this.pointHistory.length; ii++) {
      ctx.fillStyle = "hsl(" + this.hueHistory[ii] + ", 100%, 50%)";
      ctx.beginPath();
      ctx.arc(
        this.pointHistory[ii].x,
        this.pointHistory[ii].y,
        2,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}
