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
    this.r = '20';
    this.color = 'undefined';
    this.name = 'not connected';

    this.init = function (x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }
}

var index = 0;
var size = 4;
var pool = [size];
function initPlayers() {
    for (var i = 0; i < size; i++) {
        var player = new Player();
        pool[i] = player;
    }
}
initPlayers();


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
        for (var i = 0; i < size; i++) {
            if (pool[i].id === socket.id) {
                pool[i].x = pool[i].x + pos.dx;
                pool[i].y = pool[i].y + pos.dy;
                io.emit('update', JSON.stringify(pool[i]))
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
