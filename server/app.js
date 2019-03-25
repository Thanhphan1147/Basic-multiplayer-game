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
        pool[index].socket = socket.id;
        pool[index].id = index;
        pool[index].name = player.name;
        pool[index].init(randomX(), randomY(), player.color);
        //console.log('added');
        console.log(JSON.stringify(pool[index]));
        socket.emit('player_data', JSON.stringify(pool[index]));
        socket.emit('gameState', JSON.stringify(pool));
        io.emit('addplayer', JSON.stringify(pool[index]));
        index++;
        socket.join('active');
    })

    socket.on('input', (key) => {
        var pos = JSON.parse(key);
        pool[pos.id].x = pool[pos.id].x + pos.dx;
        pool[pos.id].y = pool[pos.id].y + pos.dy;
        pool[pos.id].angle = pos.angle;
        if (ColisionDetector(pos.id) || pool[pos.id].x + pool[pos.id].r >= 1853 || pool[pos.id].y + pool[pos.id].r >= 951 || pool[pos.id].x - pool[pos.id].r <= 0 || pool[pos.id].y + pool[pos.id].r <= 0) {
            pool[pos.id].x = pool[pos.id].x - pos.dx;
            pool[pos.id].y = pool[pos.id].y - pos.dy;
        }
    })

    socket.on('Mousec', (data) => {
      var player = JSON.parse(data);
      if (!arrowPool[size-1].alive) {
          arrowPool[size-1].spawn(player.x, player.y, player.angle);
          //console.log('fire');
          arrowPool.unshift(arrowPool.pop());
          arrow_count ++;
      }
    })
    socket.on('disconnect', () => {
        for (var i = 0; i < index; i++) {
            if (pool[i].socket === socket.id) {
                pool[i].reset();
                pool.push(pool.splice(i, 1));
                index--;
            }
        }
        console.log('user disconnected');
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
    io.in('active').emit('update', JSON.stringify(pool));
  }
}, 1000/60);

http.listen(8080, function () {
    console.log('listening on port 8080');
})
