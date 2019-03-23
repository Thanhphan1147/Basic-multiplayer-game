module.exports = class Arrow {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.alive = false;
    this.speed = 20
  }

  init(x, y, angle) {
    this.x = x;
    this.y = y;
    this.angle = angle;
  }
  spawn() {
    this.alive = true;
  }

  update() {
    if(this.alive)
    {
      this.x += this.speed;
    }
  }
}
