const gameWidth = 640;
const gameHeight = 480;
const spanScore = document.getElementById('score');
const spanBest = document.getElementById('best');
const btnSound = document.querySelector('.btn-sound');
const btnInfo = document.querySelector('.btn-info');
const panelInfo = document.querySelector('.stat-panel__info');
const btnClose = document.querySelector('.btn-close');

Crafty.init(gameWidth, gameHeight, document.getElementById('game'));
Crafty.background('#007958 url(./resources/images/grid.png) repeat');

const storage = {
    key: "bestScore",
    get value() {
        let best = localStorage.getItem(this.key);
        if (best) {
            return Number(best);
        } else {
            localStorage.setItem(this.key, 0);
            return 0;
        } 
    },
    set value(newScore) {
        let best = localStorage.getItem(this.key);
        if (newScore > best) localStorage.setItem(this.key, newScore);
    }
}

btnSound.addEventListener("click", function() {
    this.classList.toggle('btn-sound__off');
    Crafty.audio.toggleMute();
});

btnInfo.addEventListener("click", function() {
    panelInfo.classList.toggle("stat-panel__info-show");
});

btnClose.addEventListener("click", function() {
    panelInfo.classList.remove("stat-panel__info-show");
});


Crafty.defineScene("loading", () => {

    const assetsObj = {
        images: [
            "./resources/images/grid.png",
            "../resources/images/play.png"
        ],
        sprites: {
            "../resources/images/tileset.png": {
                tile: 32,
                tileh: 32,
                map: {
                    head: [0, 0],
                    segment: [2, 0],
                    food: [0, 1],
                }
            },
            "../resources/images/tileset-button.png": {
                tile: 64,
                tileh: 64,
                map: {
                    play: [0, 0]
                }
            }
        },
         audio: {
            tick: "../resources/sounds/tick.ogg",
            collect: "../resources/sounds/collect.ogg",
            start: "../resources/sounds/start.ogg",
            gameover: "../resources/sounds/gameover.ogg" 
        }

    };

    Crafty.load(assetsObj, function() {
        Crafty.scene("Main");
    });
});

Crafty.defineScene("Main", () => {

const baseSize = 32;
let gameStart = false;
let gameOver = false;
let direction = "up";
let canChangeDir = false;
let segments = [];
let id = -1;
let eat = null;
let score = 0;

spanScore.textContent = score;
spanBest.textContent = storage.value;

function snakeInitial() {
    segments.push(Crafty.e("Head"));
    segments.push(Crafty.e("Segment").attr({
        x: gameWidth - (baseSize * 5),
        y: gameHeight - (baseSize * 6)
    }));
    segments.push(Crafty.e("Segment").attr({
        x: gameWidth - (baseSize * 5),
        y: gameHeight - (baseSize * 5)
    }));
}

function baseOptions() {
    this.addComponent("2D, WebGL, Color");
    this.id = ++id;
    this.w = baseSize;
    this.h = baseSize;
    this.color("#ffcd75");
    this.x_prev = 0;
    this.y_prev = 0;
    this.changePrev = function(x, y) {
            this.x_prev = x;
            this.y_prev = y;
        }
}

function createEat() {
    let rnd_x = Crafty.math.randomInt(1, 18) * baseSize;
    let rnd_y = Crafty.math.randomInt(1, 13) * baseSize;
    for (let segment of segments) {
        if (rnd_x == segment.x && rnd_y == segment.y) {
            return createEat();
        }
    }
    eat = Crafty.e("Eat");
    eat.place(rnd_x, rnd_y);
}

function checkNextPos(x, y) { 
    if (x == eat.x && y == eat.y) {
        segments.push(Crafty.e("Segment").attr({
            x: segments[segments.length - 1].x,
            y: segments[segments.length - 1].y
        }));
        Crafty.audio.play("collect", 1);
        eat.destroy();
        score += 10;
        spanScore.textContent = score;
        for (let segment of segments) {
            segment.animate("glow", 3);
        }
        createEat();
    }
    for (let segment of segments) {
        if (x == segment.x && y == segment.y) {
            Crafty.trigger("GameOver");
            return true;
        }
    }
}

function withGameOver() {
    gameOver = true;
    eat.destroy();
    Crafty.e("dataText");
    canChangeDir = false;
    Crafty.audio.play("gameover", 1);
    storage.value = score;
    Crafty.e("Delay").delay(function() {
        Crafty.trigger("Restart");
    }, 2500, 1);
}

Crafty.c("Head", {
    init: function() {
        baseOptions.bind(this)();
        this.addComponent("Delay, SpriteAnimation, head");
        this.x = gameWidth - (baseSize * 5);
        this.y = gameHeight - (baseSize * 7);
        this.origin("center");
        this.rotation = 0;
        this.reel("glow", 200, [[1, 0], [0, 0]]);
        
        this.bind("Tick", function() {
            switch(direction) {
                case "up":
                    this.changePrev(this.x, this.y);
                    this.rotation = 0;
                    if (checkNextPos(this.x, this.y - baseSize)) break;
                    if (this.y == 0) {
                        Crafty.trigger("GameOver");
                        break;
                    }
                    this.y -= baseSize;
                    Crafty.audio.play("tick", 1);
                    if (!canChangeDir) canChangeDir = true;
                    break;
                case "left":
                    this.changePrev(this.x, this.y);
                    this.rotation = -90;
                    if (checkNextPos(this.x - baseSize, this.y)) break;
                    if (this.x == 0) {
                        Crafty.trigger("GameOver");
                        break;
                    }
                    this.x -= baseSize;
                    Crafty.audio.play("tick", 1);
                    if (!canChangeDir) canChangeDir = true;
                    break;
                case "right":
                    this.changePrev(this.x, this.y);
                    this.rotation = 90;
                    if (checkNextPos(this.x + baseSize, this.y)) break;
                    if (this.x == gameWidth - baseSize) {
                        Crafty.trigger("GameOver");
                        break;
                    }
                    this.x += baseSize;
                    Crafty.audio.play("tick", 1);
                    if (!canChangeDir) canChangeDir = true;
                    break;
                case "down":
                    this.changePrev(this.x, this.y);
                    this.rotation = 180;
                    if (checkNextPos(this.x, this.y + baseSize)) break;
                    if (this.y == gameHeight - baseSize) {
                        Crafty.trigger("GameOver");
                        break;
                    }
                    this.y += baseSize;
                    Crafty.audio.play("tick", 1);
                    if (!canChangeDir) canChangeDir = true;
                    break; 
            }
        });
        this.tick = function() {
            Crafty.trigger("Tick");
        }
        this.bind("GameStart", function() {
            this.delay(this.tick, 400, -1);
        });
        this.bind("GameOver", function() {
            this.cancelDelay(this.tick);
        });
        this.bind("Restart", function() {
            Crafty("*").destroy();
            Crafty.scene("Main");
        });
    }
});

Crafty.c("Segment", {
    init: function() {
        baseOptions.bind(this)();
        this.addComponent("SpriteAnimation, segment");
        this.reel("glow", 200, [[3, 0], [2, 0]]);
        this.bind("Tick", function() {
            this.changePrev(this.x, this.y);
            if (!gameOver) {
                this.x = segments[this.id - 1].x_prev;
                this.y = segments[this.id - 1].y_prev;
            }
        });
    }
});

Crafty.c("Eat", {
    init: function() {
        this.addComponent("2D, WebGL, Color, Renderable, Delay, food");
        this.color("#b13e53");
        this.w = baseSize;
        this.h = baseSize;
        this.z = 100;
    },
    place: function(x, y) {
        this.x = x;
        this.y = y;
    }
});

Crafty.c("dataText", {
    init: function() {
        this.addComponent("2D, DOM, Text");
        this.w = 160;
        this.h = 20;
        this.x = gameWidth/2 - this.w / 2;
        this.y = gameHeight/2 - this.h - 32;
        this.textFont({
            family: "ChangaOne",
            size: "32px",
        });
        this.textColor("white");
        this.text("Game Over");
    }
});

Crafty.c("Controller", {
    init: function() {
        this.addComponent("Keyboard");
        this.bind("KeyDown", function(e) {
            if (e.key == Crafty.keys.LEFT_ARROW) {
                if (direction != "right" && direction != "left" && canChangeDir) {
                    canChangeDir = false;
                    direction = "left";
                } 
            } 
            if (e.key == Crafty.keys.RIGHT_ARROW) {
                if (direction != "left" && direction != "right" && canChangeDir) {
                    canChangeDir = false;
                    direction = "right";
                } 
             } 
            if (e.key == Crafty.keys.UP_ARROW) {
                if (direction != "down" && direction != "up" && canChangeDir) {
                    canChangeDir = false;
                    direction = "up";
                } 
            } 
            if (e.key == Crafty.keys.DOWN_ARROW) {
                if (direction != "up" && direction != "down" && canChangeDir) {
                    canChangeDir = false;
                    direction = "down";
                } 
            }
            if (e.key == Crafty.keys.ENTER) {
                if (!gameStart) {
                    gameStart = true;
                    Crafty.trigger("GameStart");
                }
            } 
        });
        this.bind("GameStart", function() {
            createEat();
            playBtn.destroy();
            canChangeDir = true;
        });
        this.bind("GameOver", function() {
            withGameOver();
        });
    }
});

Crafty.c("PlayButton", {
    init: function() {
        this.addComponent("2D, DOM, Mouse, Delay, SpriteAnimation, play");
        this.w = 64;
        this.h = 64;
        this.alpha = 1.0;
        this.reel("shimmer", 200, [[0, 0], [1, 0]]);
        this.x = gameWidth / 2 - this.w / 2;
        this.y = gameHeight / 2 - this.h;
        this.css({
            "cursor": "pointer"
        });
        this.bind("Click", function() {
            if (!gameStart) {
                Crafty.audio.play("start", 1);
                this.animate("shimmer", 4);
                this.delay(function() {
                    gameStart = true;
                    Crafty.trigger("GameStart");
                }, 800, 1);
                
            }
        });
    }
});

Crafty.e("Controller");

snakeInitial();

const playBtn = Crafty.e("PlayButton");


});

Crafty.scene("loading");



