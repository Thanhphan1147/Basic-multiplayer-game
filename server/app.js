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

function Player() {
    this.connected = false;
    this.id = 'N/A';
    this.x = 0;
    this.y = 0;
    this.r = 20;
    this.color = 'undefined';
    this.name = 'not connected';

    this.init = function (x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

var index = 0;
var size = 10;
var pool = [size];
function initPlayers() {
    for (var i = 0; i < size; i++) {
        var player = new Player();
        pool[i] = player;
    }
}
initPlayers();

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
    console.log('new user connected')
    socket.on('newplayer', (val) => {
        var player = JSON.parse(val);
        pool[index].connected = true;
        pool[index].id = socket.id;
        pool[index].name = player.name;
        pool[index].init(randomX(), randomY(), player.color);
        console.log('added');
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
                if (ColisionDetector(i) || pool[i].x + pool[i].r >= 1853 || pool[i].y + pool[i].r >= 951 || pool[i].x - pool[i].r <= 0 || pool[i].y + pool[i].r <= 0) {
                    pool[i].x = pool[i].x - pos.dx;
                    pool[i].y = pool[i].y - pos.dy;
                }
                io.emit('update', JSON.stringify(pool[i]));
            }
        }
    })
    socket.on('disconnect', () => {
        for (var i = 0; i < index; i++) {
            if (pool[i].id === socket.id) {
                pool.i = new Player();
                pool.push(pool.splice(i, 1));
            }
        }
        index--;
        console.log('user disconnected')
    })
})

http.listen(8080, function () {
    console.log('listening on port 8080')
})
