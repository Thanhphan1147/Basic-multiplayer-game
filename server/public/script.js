socket = io.connect('http://localhost:8080');
//socket = io.connect('http://192.168.1.18:8080');
var size = 3;
var index = 0;
var key = {
    dx: 0,
    dy: 0,
    angle: 0,
    rotate: false
}

var mouse = {
    x: 0,
    y: 0
}

var ImageAsset = new function () {
    this.background = new Image();
    this.background.src = "/img/top-down-dungeon.jpg";
    this.bow = new Image();
    this.bow.src = "/img/bow.png";
    this.arrow = new Image();
    this.arrow.src = "/img/arrow.png";
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
    this.canvas3 = document.getElementById('canvas3');
    this.canvas2 = document.getElementById('canvas2');
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
            Background.prototype.context = this.canvas2.getContext('2d');
            Arrow.prototype.context = this.canvas3.getContext('2d');

            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight - 100;

            this.canvas2.width = window.innerWidth;
            this.canvas2.height = window.innerHeight - 100;

            this.canvas3.width = window.innerWidth;
            this.canvas3.height = window.innerHeight - 100;

            this.background = new Background();
            this.background.init(0, 0);

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

            document.addEventListener('mousemove', function (e) {
                var deg = Math.atan2( (e.pageX - game.player.x), - (e.pageY - 100 - game.player.y) ) - Math.PI/2;
                //game.position.innerHTML = "rotation: " + deg;
                key.angle = deg;
                key.rotate = true;
            });

            document.addEventListener("click", function(){
              //console.log(game.player);
              socket.emit('Mouseclick', JSON.stringify({
                id: game.player.id,
                x: game.player.x,
                y: game.player.y,
                angle: game.player.angle
              }));
            });

            return true;
        } else {
            return false;
        }
    }
    this.start = function () {
        this.background.draw();
        this.player.draw();        //draw player
        for (var i = 0; i < index; i++) {                               //draw other players
            this.otherPlayers[i].draw();
        }
        animate();
        console.log('start');
    }

}

function animate() {
    game.player.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    Arrow.prototype.context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    game.player.draw();        //draw player
    game.player.quiver.animate();
    for (var i = 0; i < index; i++) {                               //draw other players
      game.otherPlayers[i].draw();
      game.otherPlayers[i].quiver.animate();
    }
    if (key.dx != 0 || key.dy != 0 || key.rotate) {
        socket.emit('input', JSON.stringify(key));
        key.rotate = false;
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
            game.otherPlayers[index].init(state[i].x, state[i].y, state[i].color, state[i].angle);
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
    game.player.init(pos.x, pos.y, pos.color, pos.angle);
    game.player.id = pos.id;
})

socket.on('addplayer', (val) => {
    var player = JSON.parse(val);
    this.hub.innerHTML += player.name + " connected <br>";
    if (player.id != game.player.id) {
        game.otherPlayers[index].id = player.id;
        game.otherPlayers[index].connected = true;
        game.otherPlayers[index].name = player.name;
        game.otherPlayers[index].init(player.x, player.y, player.color, player.angle);
        index++;
    }
})

socket.on('update', (val) => {
    var pos = JSON.parse(val);
    if (pos.id === game.player.id) {
        game.player.x = pos.x;
        game.player.y = pos.y;
        game.player.angle = pos.angle;
    } else {
        for (var i = 0; i < index; i++) {
            if (game.otherPlayers[i].id === pos.id) {
                game.otherPlayers[i].x = pos.x;
                game.otherPlayers[i].y = pos.y;
                game.otherPlayers[i].angle = pos.angle;
            }
        }
    }

})

socket.on('Fire!', (id) => {
  //console.log('input: ' + id);
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

function Player() {
    this.id = 'N/A';
    this.x = 0;
    this.y = 0;
    this.r = 24;
    this.angle = 0;
    this.color = 'undefined';
    this.name = 'not connected';
    this.connected = false;
    this.colision = false;

    this.quiver = new Pool(10);
    this.quiver.init();

    this.init = function (x, y, color, angle) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.angle = angle;
    }

    this.draw = function () {
        //  rotate
        this.context.translate(this.x,this.y);
        this.context.rotate(+this.angle);
        //draw player
        this.context.beginPath();
        this.context.arc(0 + this.r/2 + this.r/6, 0 + this.r/2 + this.r/12, this.r/3 + this.r/12, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.stroke();

        this.context.beginPath();
        this.context.arc(0 + this.r/2 + this.r/6, 0 - this.r/2 - this.r/12, this.r/3 + this.r/12, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.stroke();

        this.context.beginPath();
        this.context.arc(0, 0, this.r, 0, 2 * Math.PI);
        this.context.fillStyle = this.color;
        this.context.fill();
        this.context.stroke();
        this.context.drawImage(ImageAsset.bow, 0 - ImageAsset.bow.width * 0.3/2, 0 - ImageAsset.bow.height * 0.3/2, ImageAsset.bow.width * 0.3, ImageAsset.bow.height * 0.3);
        //  rotate
        this.context.rotate(-this.angle);
        this.context.translate(-this.x,-this.y);
        // player name
        this.context.font = "15px Comic Sans MS";
        this.context.fillStyle = 'black';
        this.context.fillText(this.name, this.x - this.context.measureText(this.name).width / 2, this.y - this.r - this.r/6);
    }
}

function DrawableObj() {
    this.x = 0;
    this.y = 0;

    this.init = function (x, y) {
        this.x = x;
        this.y = y;
    }
}

function Background() {
    this.draw = function () {
        this.context.scale(window.innerWidth/ImageAsset.background.width,window.innerHeight/ImageAsset.background.height);
        this.context.drawImage(ImageAsset.background, this.x, this.y);
    }
}

function Arrow() {
    this.speed = 20;
    this.alive = false;
    this.angle = 0;
    this.originX = 0;
    this.originY = 0;
    this.width = ImageAsset.arrow.width * 0.3;
    this.height = ImageAsset.arrow.height * 0.3;

    this.init = function(x, y) {
      this.x = x;
      this.y = y;
    }

    this.draw = function () {
        this.context.translate(this.originX, this.originY);
        this.context.rotate(+this.angle);
        /*
        for (var i = 0; i < index; i++) {
          if (LineCollision({x: this.originX + Math.cos(this.angle)*(this.x + this.speed), y: this.originY + Math.sin(this.angle)*(this.x + this.speed)}, {x: this.originX + Math.cos(this.angle)*this.x, y: this.originY + Math.sin(this.angle)*this.x}, {x: game.otherPlayers[i].x - game.otherPlayers[i].r, y: game.otherPlayers[i].y + game.otherPlayers[i].r}, {x: game.otherPlayers[i].x - game.otherPlayers[i].r, y: game.otherPlayers[i].y - game.otherPlayers[i].r}) || LineCollision({x: this.originX + Math.cos(this.angle)*(this.x + this.speed), y: this.originY + Math.sin(this.angle)*(this.x + this.speed)}, {x: this.originX + Math.cos(this.angle)*this.x, y: this.originY + Math.sin(this.angle)*this.x}, {x: game.otherPlayers[i].x - game.otherPlayers[i].r, y: game.otherPlayers[i].y + game.otherPlayers[i].r}, {x: game.otherPlayers[i].x + game.otherPlayers[i].r, y: game.otherPlayers[i].y + game.otherPlayers[i].r}) || LineCollision({x: this.originX + Math.cos(this.angle)*(this.x + this.speed), y: this.originY + Math.sin(this.angle)*(this.x + this.speed)}, {x: this.originX + Math.cos(this.angle)*this.x, y: this.originY + Math.sin(this.angle)*this.x}, {x: game.otherPlayers[i].x - game.otherPlayers[i].r, y: game.otherPlayers[i].y - game.otherPlayers[i].r}, {x: game.otherPlayers[i].x + game.otherPlayers[i].r, y: game.otherPlayers[i].y - game.otherPlayers[i].r}) || LineCollision({x: this.originX + Math.cos(this.angle)*(this.x + this.speed), y: this.originY + Math.sin(this.angle)*(this.x + this.speed)}, {x: this.originX + Math.cos(this.angle)*this.x, y: this.originY + Math.sin(this.angle)*this.x}, {x: game.otherPlayers[i].x + game.otherPlayers[i].r, y: game.otherPlayers[i].y - game.otherPlayers[i].r}, {x: game.otherPlayers[i].x + game.otherPlayers[i].r, y: game.otherPlayers[i].y + game.otherPlayers[i].r}) ) {
            this.context.rotate(-this.angle);
            this.context.translate(- this.originX,- this.originY);
            return true;
          }
        }
        */
        if (LineCollision({x: this.originX + Math.cos(this.angle)*(this.x + this.speed), y: this.originY + Math.sin(this.angle)*(this.x + this.speed)}, {x: this.originX + Math.cos(this.angle)*this.x, y: this.originY + Math.sin(this.angle)*this.x}, {x: 0, y: 0}, {x: 0, y: 900}) ||LineCollision({x: this.originX + Math.cos(this.angle)*(this.x + this.speed), y: this.originY + Math.sin(this.angle)*(this.x + this.speed)}, {x: this.originX + Math.cos(this.angle)*this.x, y: this.originY + Math.sin(this.angle)*this.x}, {x: 0, y: 0}, {x: 1853, y: 0}) || LineCollision({x: this.originX + Math.cos(this.angle)*(this.x + this.speed), y: this.originY + Math.sin(this.angle)*(this.x + this.speed)}, {x: this.originX + Math.cos(this.angle)*this.x, y: this.originY + Math.sin(this.angle)*this.x}, {x: 1853, y: 0}, {x: 1853, y: 900}) || LineCollision({x: this.originX + Math.cos(this.angle)*(this.x + this.speed), y: this.originY + Math.sin(this.angle)*(this.x + this.speed)}, {x: this.originX + Math.cos(this.angle)*this.x, y: this.originY + Math.sin(this.angle)*this.x}, {x: 0, y: 900}, {x: 1853, y: 900})) {
          this.context.rotate(-this.angle);
          this.context.translate(- this.originX,- this.originY);
          return true;
        } else {
            this.x += this.speed;
            this.context.drawImage(ImageAsset.arrow,this.x - ImageAsset.arrow.width * 0.3/2, 0 - ImageAsset.arrow.height * 0.3/2, ImageAsset.arrow.width * 0.3, ImageAsset.arrow.height * 0.3);
        }
        this.context.rotate(-this.angle);
        this.context.translate(- this.originX,- this.originY);
        return false;
    };

    this.reset = function () {
        this.x = 0;
        this.y = 0;
        this.alive = false;
    };

    this.spawn = function (x, y, angle) {
        this.alive = true;
        this.angle = angle;
        this.originX = x;
        this.originY = y;
    };
}

function Pool(maxCapacity) {
    var size = maxCapacity;
    var pool = [];
    this.init = function () {
      for (var i = 0; i < size; i++) {
          var arrow = new Arrow();
          arrow.init(0,0);
          pool[i] = arrow;
      }
    };
    this.get = function (x, y, angle) {
        if (!pool[size-1].alive) {
            pool[size-1].spawn(x, y, angle);
            pool.unshift(pool.pop());
        }
    };
    this.animate = function () {
        for (var i = 0; i < size; i++) {
            if (pool[i].alive) {
                if (pool[i].draw()) {
                    //console.log('exception reset');
                    pool[i].reset();
                    pool.push((pool.splice(i,1))[0]);
                }
            } else
                break;
        }
    };
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


//Arrow.prototype = new DrawableObj();
Background.prototype = new DrawableObj();

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
