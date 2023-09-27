class Pointer {
    constructor(id) {
        this.id = id;
    }
    convert({x, y}) {
        x *= devicePixelRatio;
        y *= devicePixelRatio;
        x -= game.x;
        y -= game.y;
        x /= game.scale;
        y /= game.scale;
        return {x, y};
    }
    /**@param {Touch} e*/
    start(e) {
        this.startTime = Date.now();
        this.endTime = 0;
        var {x, y} = this.convert({x: e.pageX, y: e.pageY});
        this.sx = x;
        this.sy = y;
        this.x = x;
        this.y = y;
        this.dead = 0;
        this.used = 0;
    }
    getStart() {
        return {x: this.sx, y: this.sy};
    }
    used = 0;
    dead = 0;
    x = 0;
    y = 0;
    sx = 0;
    sy = 0;
    startTime = 0;
    endTime = 0;
    /**@param {Touch} e*/
    move(e) {
        var {x, y} = this.convert({x: e.pageX, y: e.pageY});
        this.x = x;
        this.y = y;
    }
    /**@param {Touch} e*/
    end(e) {
        var {x, y} = this.convert({x: e.pageX, y: e.pageY});
        this.endTime = Date.now();
        this.x = x;
        this.y = y;
        this.dead = 1;
    }
    /**@param {Touch} e*/
    cancel(e) {
        console("cancel");
        this.end(e);
    }
    update() {
        if (this.dead) return;
    }
}
/**@type {Map<number, Pointer>}*/
var touches = new Map();
if ("ontouchstart" in window) {
    var mobile = true;
} else {
    var desktop = true;
    setupDesktop();
}
function setupDesktop() {
    onmousedown = e => {
        e.identifier = -1;
        ontouchstart({ changedTouches: [e] });
    };
    onmousemove = e => {
        if (!touches.get(-1) || touches.get(-1).dead) return;

        e.identifier = -1;
        ontouchmove({ changedTouches: [e] });
    };
    onmouseup = e => {
        e.identifier = -1;
        ontouchend({ changedTouches: [e] });
    };
    onmouseleave = e => {
        e.identifier = -1;
        ontouchcancel({ changedTouches: [e] });
    };
}

ontouchstart = e => [...e.changedTouches].forEach(e => {
    var touch = touches.get(e.identifier) || new Pointer(e.identifier);
    touches.set(touch.id, touch);

    touch.start(e);
});
ontouchmove = e => [...e.changedTouches].forEach(e => {
    var touch = touches.get(e.identifier);
    touch?.move(e);
});
ontouchend = e => [...e.changedTouches].forEach(e => {
    var touch = touches.get(e.identifier);
    touch?.end(e);
    // canvas.requestFullscreen({navigationUI: "show"});
});
ontouchcancel = e => [...e.changedTouches].forEach(e => {
    var touch = touches.get(e.identifier);
    touch?.cancel(e);
});
oncontextmenu = e => e.preventDefault();