const gameWidth = 640;
const gameHeight = 480;

Crafty.init(gameWidth, gameHeight, document.getElementById('game'));
Crafty.background('#007958 url(/resources/images/grid.png) repeat');

const assetsObj = {
    "images": [
        "../resources/images/head.png", 
        "../resources/images/segment.png", 
        "../resources/images/food.png", 
        "../resources/images/grid.png",
        "../resources/images/play.png"
    ],
};

function setupSprites() {
    Crafty.sprite("../resources/images/head.png", {head: [0,0,32,32]});
    Crafty.sprite("../resources/images/segment.png", {segment: [0,0,32,32]});
    Crafty.sprite("../resources/images/food.png", {food: [0,0,32,32]});
    Crafty.sprite("../resources/images/play.png", {play: [0,0,64,64]});
}

Crafty.load(assetsObj, function() {
    setupSprites();
    Crafty.scene("Main");
});


Crafty.defineScene("Main", () => {

const baseSize = 32;
let gameStart = false;
let gameOver = false;
let direction = "up";
let canChangeDir = false;
let segments = [];
let id = -1;
let eat;

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
        eat.destroy();
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
}

Crafty.c("Head", {
    init: function() {
        baseOptions.bind(this)();
        this.addComponent("Delay, head");
        this.x = gameWidth - (baseSize * 5);
        this.y = gameHeight - (baseSize * 7);
        
        this.bind("Tick", function() {
            switch(direction) {
                case "up":
                    this.changePrev(this.x, this.y);
                    if (checkNextPos(this.x, this.y - baseSize)) break;
                    if (this.y == 0) {
                        Crafty.trigger("GameOver");
                        break;
                    }
                    this.y -= baseSize;
                    if (!canChangeDir) canChangeDir = true;
                    break;
                case "left":
                    this.changePrev(this.x, this.y);
                    if (checkNextPos(this.x - baseSize, this.y)) break;
                    if (this.x == 0) {
                        Crafty.trigger("GameOver");
                        break;
                    }
                    this.x -= baseSize;
                    if (!canChangeDir) canChangeDir = true;
                    break;
                case "right":
                    this.changePrev(this.x, this.y);
                    if (checkNextPos(this.x + baseSize, this.y)) break;
                    if (this.x == gameWidth - baseSize) {
                        Crafty.trigger("GameOver");
                        break;
                    }
                    this.x += baseSize;
                    if (!canChangeDir) canChangeDir = true;
                    break;
                case "down":
                    this.changePrev(this.x, this.y);
                    if (checkNextPos(this.x, this.y + baseSize)) break;
                    if (this.y == gameHeight - baseSize) {
                        Crafty.trigger("GameOver");
                        break;
                    }
                    this.y += baseSize;
                    if (!canChangeDir) canChangeDir = true;
                    break; 
            }
        });
        this.tick = function() {
            Crafty.trigger("Tick");
        }
        this.bind("GameStart", function() {
            this.delay(this.tick, 250, -1);
        });
        this.bind("GameOver", function() {
            this.cancelDelay(this.tick);
        })
        
    }
});

Crafty.c("Segment", {
    init: function() {
        baseOptions.bind(this)();
        this.addComponent("segment");
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
        this.delay(() => {
            this.visible = !this.visible;
        }, 500, -1);
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
                if (direction != "right" && canChangeDir) {
                    canChangeDir = false;
                    direction = "left";
                } 
            } 
            if (e.key == Crafty.keys.RIGHT_ARROW) {
                if (direction != "left" && canChangeDir) {
                    canChangeDir = false;
                    direction = "right";
                } 
             } 
            if (e.key == Crafty.keys.UP_ARROW) {
                if (direction != "down" && canChangeDir) {
                    canChangeDir = false;
                    direction = "up";
                } 
            } 
            if (e.key == Crafty.keys.DOWN_ARROW) {
                if (direction != "up" && canChangeDir) {
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
        this.addComponent("2D, DOM, Mouse, play");
        this.w = 64;
        this.h = 64;
        this.alpha = 1.0;
        this.x = gameWidth / 2 - this.w / 2;
        this.y = gameHeight / 2 - this.h;
        this.css({
            "cursor": "pointer"
        });
        this.bind("Click", function() {
            if (!gameStart) {
                gameStart = true;
                Crafty.trigger("GameStart");
            }
        });
    }
});

Crafty.e("Controller");

snakeInitial();

const playBtn = Crafty.e("PlayButton");

});

