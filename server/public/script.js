socket = io.connect('http://192.168.1.18:8080');
var size = 3;
var index = 0;
var key = {
    dx: 0,
    dy: 0
}

function Preload() {
    var preloaddiv = document.getElementById('preload');
    var pl = document.getElementById('pl');
    var col = document.getElementById('col');
    var preload = {
        name: pl.value,
        color: col.value
    }
    preloaddiv.style.display = 'none';
    socket.emit('newplayer', JSON.stringify(preload));
}

var game = new Game();

function init() {
    if (game.init()) {
        console.log("init");
        game.start();
    }
}

function Game() {
    this.canvas = document.getElementById('canvas');
    this.position = document.getElementById('position');
    this.hub = document.getElementById('hub');

    this.otherPlayers = [size];
    for (var i = 0; i < size; i++) {
        this.otherPlayers[i] = new Player();
    }
    this.player = new Player();
    this.connected = true;

    this.init = function () {
        if (this.canvas.getContext) {
            Player.prototype.context = this.canvas.getContext('2d');
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;

            document.addEventListener('keydown', function (e) {
                switch (e.keyCode) {
                    case 87:
                        key.dy = -2;
                        break;
                    case 83:
                        key.dy = +2;
                        break;
                    case 65:
                        key.dx = -2;
                        break;
                    case 68:
                        key.dx = +2;
                        break;
                }
            });

            document.addEventListener('keyup', function (e) {
                switch (e.keyCode) {
                    case 87:
                        key.dy = 0
                        break;
                    case 83:
                        key.dy = 0
                        break;
                    case 65:
                        key.dx = 0
                        break;
                    case 68:
                        key.dx = 0
                        break;
                }
            });

            return true;
        } else {
            return false;
        }
    }
    this.start = function () {
        this.player.draw();        //draw player
        for (var i = 0; i < size; i++) {                               //draw other players
            if (this.otherPlayers[i].connected === true) {
                this.otherPlayers[i].draw();
            }
        }
        animate();
        console.log('start');
    }

}

function animate() {
    game.player.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    game.player.draw();        //draw player
    for (var i = 0; i < size; i++) {                               //draw other players
        if (game.otherPlayers[i].connected === true) {
            game.otherPlayers[i].draw();
        }
    }
    if (key.dx != 0 || key.dy != 0) {
        socket.emit('input', JSON.stringify(key));
    }
    requestAnimFrame(animate);
}

socket.on('gameState', (pool) => {
    var state = JSON.parse(pool);
    console.log(state);
    for (var i = 0; i < size; i++) {
        if (state[i].connected === true && state[i].id != game.player.id) {
            game.otherPlayers[index].id = state[i].id;
            game.otherPlayers[index].connected = true;
            game.otherPlayers[index].name = state[i].name;
            game.otherPlayers[index].init(state[i].x, state[i].y, state[i].color);
            index++;
        }
    }
    console.log(game.otherPlayers);
    init();
})

socket.on('player_data', (val) => {
    var pos = JSON.parse(val);
    console.log(pos);
    game.player.name = pos.name;
    game.player.init(pos.x, pos.y, pos.color);
    game.player.id = pos.id;
})

socket.on('addplayer', (val) => {
    var player = JSON.parse(val);
    this.hub.innerHTML += player.name + " connected <br>";
    if (player.id != game.player.id) {
        game.otherPlayers[index].id = player.id;
        game.otherPlayers[index].connected = true;
        game.otherPlayers[index].name = player.name;
        game.otherPlayers[index].init(player.x, player.y, player.color);
        index++;
    }
})

socket.on('update', (val) => {
    var pos = JSON.parse(val);
    if (pos.id === game.player.id) {
        game.player.x = pos.x;
        game.player.y = pos.y;
    } else {
        for (var i = 0; i < index; i++) {
            if (game.otherPlayers[i].id === pos.id) {
                game.otherPlayers[i].x = pos.x;
                game.otherPlayers[i].y = pos.y;
            }
        }
    }

})

function Player() {
    this.id = 'N/A';
    this.x = 0;
    this.y = 0;
    this.r = '20';
    this.color = 'undefined';
    this.name = 'not connected';
    this.connected = false;
    this.colision = false;

    this.init = function (x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
    }

    this.draw = function () {
        this.context.beginPath();
        this.context.arc(this.x, this.y, this.r, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.stroke();
        this.context.font = "15px Comic Sans MS";
        this.context.fillStyle = 'black'
        this.context.fillText(this.name, this.x - this.r, this.y - this.r);
    }
}

window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function */ callback, /* DOMElement */ element) {
            window.setTimeout(callback, 1000 / 60);
        };
})();
