const Arrow = require('./Arrow.js');
module.exports = class Player {
  constructor() {
    this.connected = false;
    this.socket = 'N/A';
    this.id = 'N/A';
    this.x = 0;
    this.y = 0;
    this.r = 24;
    this.angle = 0;
    this.color = 'undefined';
    this.name = 'not connected';
    this.arrow = new Arrow();
  }

    init(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
    reset() {
      this.connected = false;
      this.id = 'N/A';
      this.x = 0;
      this.y = 0;
      this.r = 24;
      this.angle = 0;
      this.color = 'undefined';
      this.name = 'not connected';
    }
}
