//Node modules
var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
//Local modules
const Player = require('./Player.js');

//Variables and function declaration
var index = 0;
var size = 4;

var pool = [size];

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

initPlayers();
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

    socket.on('Mouseclick', (data) => {
      var player = JSON.parse(data);
      if(!pool[player.id].arrow.alive) {
        pool[player.id].arrow.spawn(player.x, player.y, player.angle);
        io.emit('fire', JSON.stringify({
          id: player.id,
          pX: player.x,
          pY: player.y,
          angle: player.angle
        }));
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
  for(var i = 0; i < index; i++) {
    var a = {
      x: pool[i].arrow.pX + Math.cos(pool[i].arrow.angle)*(pool[i].arrow.x),
      y: pool[i].arrow.pY + Math.sin(pool[i].arrow.angle)*(pool[i].arrow.x)
    }
    var b = {
      x: a.x + Math.cos(pool[i].arrow.angle)*pool[i].arrow.speed,
      y: a.y + Math.sin(pool[i].arrow.angle)*pool[i].arrow.speed
    }
    for(var j = 0; j < index; j++) {
      if(j != i) {
        if(LineCollision(a, b, {x: pool[j].x,y: pool[j].y - pool[j].r}, {x: pool[j].x,y: pool[j].y + pool[j].r})) {
          pool[i].arrow.reset();
          pool[j].health -= 10;
        }
      }
    }
    if(pool[i].arrow.x >= 1000) {
      pool[i].arrow.reset();
    }
    pool[i].arrow.update();
  }

}

setInterval( () => {
  //console.log(Tick());
  if (index > 0) {
    Tick();
    io.in('active').emit('update', JSON.stringify(pool));
  }
}, 1000/60);

http.listen(8080, function () {
    console.log('listening on port 8080');
})
