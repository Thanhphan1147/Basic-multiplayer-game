var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


function randomX() {
    var x = Math.floor((Math.random() * (1600 - 250) + 1));
    //console.log(x);
    return x;
}

function randomY() {
    var y = Math.floor((Math.random() * (800 - 200) + 100));
    //console.log(y);
    return y;
}

function LineCollision(p1, p2, p3, p4) {
    var d = ((p4.y - p3.y) * (p2.x - p1.x)) - ((p4.x - p3.x) * (p2.y - p1.y));
    var n1 = ((p4.x - p3.x) * (p1.y - p3.y)) - ((p4.y - p3.y) * (p1.x - p3.x));
    var n2 = ((p2.x - p1.x) * (p1.y - p3.y)) - ((p2.y - p1.y) * (p1.x - p3.x));

    if ( d == 0.0 )
    {
        if ( n1 == 0.0 && n2 == 0.0 )
        {
            return false;  //COINCIDENT;
        }

        return false;   // PARALLEL;
    }

    var ua = n1 / d;
    var ub = n2 / d;
    //console.log(p1.x + ',' + p1.y + ',' + p2.x + ',' + p2.y);
    return (ua >= 0.0 && ua <= 1.0 && ub >= 0.0 && ub <= 1.0);
}


function Player() {
    this.connected = false;
    this.id = 'N/A';
    this.x = 0;
    this.y = 0;
    this.r = 24;
    this.angle = 0;
    this.color = 'undefined';
    this.name = 'not connected';

    this.arrow = [15];
    for (var i = 0; i < 15; i++) {
        var obj = new Arrow();
        this.arrow[i] = obj;
    }

    this.init = function (x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
    this.reset = function() {
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

function Arrow() {
    this.x = 0;
    this.y = 0;
    this.angle = 0;
    this.alive = false;
    this.speed = 20;

    this.init = function(x, y, angle) {
      this.x = x;
      this.y = y;
      this.angle = angle;
    }
    this.spawn = function (x, y, angle) {
        this.alive = true;
        this.angle = angle;
        this.originX = x;
        this.originY = y;
    };

    this.update = function(){
      if(this.alive) {
        this.x += this.speed;
      }
    }
}

var index = 0;
var size = 4;
var size2 = size * 10;
var pool = [size];
var arrowPool = [size2];
function initPlayers() {
    for (var i = 0; i < size; i++) {
        var player = new Player();
        pool[i] = player;
    }
}
initPlayers();
//console.log(pool[0]);
function Detector(object1, object2) {
    if (object1.x + object1.r >= object2.x - object2.r && object2.x + object2.r >= object1.x - object1.r && object1.y + object1.r >= object2.y - object2.r && object2.y + object2.r >= object1.y - object1.r) {
        //console.log('colision');
        return true;
    }
    return false;
}

function ColisionDetector(key) {
    for (var i = 0; i < index; i++) {
        if (key != i) {
            if (Detector(pool[key], pool[i]))
                return true;
        }
    }
    return false;
}
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

io.on('connection', (socket) => {
    console.log('new user connected');
    socket.on('newplayer', (val) => {
        var player = JSON.parse(val);
        pool[index].connected = true;
        pool[index].id = socket.id;
        pool[index].name = player.name;
        pool[index].init(randomX(), randomY(), player.color);
        console.log(JSON.stringify(pool[index]));
        socket.emit('player_data', JSON.stringify(pool[index]));
        socket.emit('gameState', JSON.stringify(pool));
        io.emit('addplayer', JSON.stringify(pool[index]));
        index++;
    })

    socket.on('input', (key) => {
        var pos = JSON.parse(key)
        for (var i = 0; i < index; i++) {
            if (pool[i].id === socket.id) {
                pool[i].x = pool[i].x + pos.dx;
                pool[i].y = pool[i].y + pos.dy;
                pool[i].angle = pos.angle;
                if (ColisionDetector(i) || pool[i].x + pool[i].r >= 1853 || pool[i].y + pool[i].r >= 951 || pool[i].x - pool[i].r <= 0 || pool[i].y + pool[i].r <= 0) {
                    pool[i].x = pool[i].x - pos.dx;
                    pool[i].y = pool[i].y - pos.dy;
                }
                io.emit('update', JSON.stringify(pool[i]));
            }
        }
    })

    socket.on('Mouseclick', (data) => {
      var player = JSON.parse(data);
      for (var i = 0; i < index; i++) {
          if (pool[i].id === player.id) {
          }
        }
      if (id === game.player.id) {
          game.player.quiver.get(game.player.x, game.player.y, game.player.angle);
      } else {
          for (var i = 0; i < index; i++) {
              if (game.otherPlayers[i].id === id) {
                game.otherPlayers[i].quiver.get(game.otherPlayers[i].x, game.otherPlayers[i].y, game.otherPlayers[i].angle);
              }
          }
      }
    })
    socket.on('disconnect', () => {
        for (var i = 0; i < index; i++) {
            if (pool[i].id === socket.id) {
                pool[i].reset();
                pool.push(pool.splice(i, 1));
                index--;
            }
        }
        console.log('user disconnected')
    })
})
function Tick() {
  for (var i = 0; i < index; i++) {
      if (pool[i].connected === true) {
        for (var i = 0; i < 15; i++) {
          pool[i].arrow[i].update();
        }
      }
    }
    io.emit('gamedata',JSON.stringify(pool);
}

setInterval(() => {
  //console.log(JSON.stringify(pool));
}, 500);

http.listen(8080, function () {
    console.log('listening on port 8080')
})
