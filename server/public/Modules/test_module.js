const Player = require('./Player.js');
const Arrow = require('./Arrow.js');
var arrow = new Arrow();
var pool = [4];
for (var i = 0; i < 4; i++) {
  pool[i] = new Player();
}
arrow.init(10, 10, Math.PI/2);
console.log(pool);
console.log(arrow);
