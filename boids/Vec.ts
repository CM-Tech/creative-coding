export class Vec {
  x: number;
  y: number;
  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }
  add(other: Vec) {
    this.x += other.x;
    this.y += other.y;
    return this;
  }
  sub(other: Vec) {
    this.x -= other.x;
    this.y -= other.y;
    return this;
  }
  dist(other: Vec) {
    return Math.sqrt(this.distSquare(other));
  }
  distSquare(other: Vec) {
    return Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2);
  }
  copy() {
    return new Vec(this.x, this.y);
  }
  lengt() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }
  normalize() {
    const len = this.lengt();
    this.x /= len;
    this.y /= len;
    return this;
  }
  div(o: number) {
    this.x /= o;
    this.y /= o;
    return this;
  }
  mult(o: number) {
    this.x *= o;
    this.y *= o;
    return this;
  }

  setMag(mag: number) {
    this.normalize();
    this.mult(mag);
    return this;
  }
  limit(max: number) {
    this.setMag(Math.min(this.lengt(), max));
    return this;
  }
}
