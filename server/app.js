//Node modules
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//Local modules
const Player = require('./Player.js');
const Arrow = require('./Arrow.js');
//Variables and function declaration
var index = 0;
var size = 4;
var size2 = size * 10;
var arrow_count = 0;

var pool = [size];
var arrowPool = [size2];

function randomX() {
    var x = Math.floor((Math.random() * (1600 - 400) + 1));
    //console.log(x);
    return x;
}

function randomY() {
    var y = Math.floor((Math.random() * (800 - 150) + 100));
    //console.log(y);
    return y;
}

function initPlayers() {
    for (var i = 0; i < size; i++) {
        var player = new Player();
        pool[i] = player;
    }
}
function initArrows() {
    for (var i = 0; i < size2; i++) {
        var arrow = new Arrow();
        arrowPool[i] = arrow;
    }
}
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

initPlayers();
initArrows();
//-----------------------//
app.use(express.static('public'));
app.get('/', (req, res) => {
    res.sendFile(__dirname + "/index.html")
})

io.on('connection', (socket) => {
    console.log('new user connected');
    //console.log(index);
    socket.on('newplayer', (val) => {
        var player = JSON.parse(val);
        pool[index].connected = true;
        pool[index].id = socket.id;
        pool[index].name = player.name;
        pool[index].init(randomX(), randomY(), player.color);
        //console.log('added');
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
            }
        }
    })

    socket.on('Mouseclick', (data) => {
      var player = JSON.parse(data);
      if (!arrowPool[size-1].alive) {
          arrowPool[size-1].spawn(x, y, angle);
          //console.log('fire');
          arrowPool.unshift(arrowPool.pop());
          arrow_count ++;
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

//handle game logic, colision detector,....
function Tick() {
  for(var i = 0; i < arrow_count; i++) {
    if(arrowPool[i].x > 800 ) {
      arrowPool[i].reset();
      arrowPool.push((arrowPool.splice(i,1))[0]);
    } else {
      arrowPool[i].update();
    }
  }

  return {
    players: pool,
    arrows: arrowPool
  }
}

setInterval( () => {
  //console.log(Tick());
  if (index > 0) {
    io.emit('gametick', JSON.stringify(Tick()));
  }
}, 500);

http.listen(8080, function () {
    console.log('listening on port 8080');
})
