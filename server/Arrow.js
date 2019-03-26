module.exports = class Arrow {
  constructor() {
    this.pX = 0;
    this.pY = 0;
    this.x = 0;
    this.angle = 0;
    this.alive = false;
    this.speed = 20;
    this.health = 100;
  }

  spawn(x, y, angle) {
    this.alive = true;
    this.pX = x;
    this.pY = y;
    this.angle = angle;
  }

  update() {
    if(this.alive)
    {
      this.x += this.speed;
    }
  }

  reset() {
    this.pX = 0;
    this.pY = 0;
    this.x = 0;
    this.alive = false;
  }
}
