var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");

// ctx._drawImage = ctx.drawImage;
// ctx.drawImage = (image, ...params) => ctx._drawImage(image, ...params.map(a => pixel(a)));

var _canvas = document.createElement("canvas");
var _ctx = _canvas.getContext("2d");

var image = src => {
	var image = document.createElement('img');
	image.setAttribute('src', src);
	return image;
};
var spritesheet = (image, wid, hei, pad = 4) => {
	wid *= 16; hei *= 16; pad *= 16;
	var w = wid + pad, h = hei + pad;
	return (x, y) => [image, x * w, y * h, wid, hei];
};
var testImage = image("./images/test.png");
var landscape = image("./images/landscape.png");
var clouds = image("./images/clouds.png");

var green_buttons = spritesheet(image("./images/green_buttons.png"), 24, 24);
var green_buttons_shaded = spritesheet(image("./images/green_buttons_shaded.png"), 24, 24);
var green_button_progress = spritesheet(image("./images/green_progress.png"), 24, 24);

var game = {
	width: 400,
	height: 800,
	w: 400, h: 800,
	x: 0, y: 0
};
var { cos, sin, PI, sign, abs } = Math;
var flr = Math.floor;
var pixel = x => flr(x / 4) * 4;

onload = async () => {
	document.body.appendChild(canvas);
	// document.body.appendChild(_canvas);
	canvas.needsResize = 1;
	init();
};

var startTime = 0;
function init() {
	startTime = Date.now();
	lastFrame = startTime;
	main();
}
onresize = () => canvas.needsResize = 1;
async function resizeCanvas() {
	if (!canvas.needsResize) return;

	canvas.style.width = innerWidth + 'px';
	canvas.style.height = innerHeight + 'px';

	canvas.width = flr(innerWidth * devicePixelRatio);
	canvas.height = flr(innerHeight * devicePixelRatio);
	_canvas.width = canvas.width;
	_canvas.height = canvas.height;

	game.h = canvas.height;
	game.w = canvas.width;

	canvas.needsResize = 0;

	if (game.w * 2 > game.h) {
		game.w = game.h / 2;
		game.x = (canvas.width - game.w) / 2;
		game.y = 0;
	} else {
		game.h = game.w * 2;
		game.y = (canvas.height - game.h) / 2;
		game.x = 0;
	}
	game.scale = game.w / 400;

	game.x = flr(game.x);
	game.y = flr(game.y);
	game.w = flr(game.w);
	game.h = flr(game.h);
}
var black = "#272736";
var white = "#ffffeb";
function clearCanvas() {
	ctx.resetTransform();
	_ctx.resetTransform();
	ctx.fillStyle = black;
	ctx.fillRect(0, 0, canvas.width, canvas.height);
	_ctx.clearRect(0, 0, canvas.width, canvas.height);
}
function zoomCanvas() {
	ctx.resetTransform();
	ctx.translate(game.x, game.y);
	ctx.scale(game.scale, game.scale);
}
function outlineFrame() {
	ctx.strokeStyle = black;
	ctx.fillStyle = white;
	ctx.fillRect(0, 0, game.width, game.height);
}
function drawBackground() {
	ctx.translate(battle.ox, 0);
	ctx.drawImage(landscape, -100, -128, 800, 800);
	var x = (Date.now() / 200) % 800;
	var Y = -80;

	ctx.drawImage(clouds, -100 + x - 800, Y, 800, 800);
	ctx.drawImage(clouds, -100 + x, Y, 800, 800);
	ctx.translate(-battle.ox, 0);
}
function drawBattlers(battlers) {
	ctx.translate(battle.ox, 0);
	for (let battler of battlers) {
		battler.draw();
	}
	ctx.translate(-battle.ox, 0);
}
function drawHitboxes() {
	ctx.translate(battle.ox, 0);
	for (let hitbox of hitboxes.array) {
		hitbox.draw();
	}
	ctx.translate(-battle.ox, 0);
}
function renderEnemyView(My) {
	if (My >= 400) return;
	var blox = battle.ox;
	battle.ox = 0;
	ctx.translate(-256, -128 - 64 - 16 - My);

	drawBackground();
	drawBattlers([...allies, ...enemies]);
	zoomCanvas();

	ctx.translate(0, -My);
	ctx.transform(1, 100 / 400, 0, 1, 0, 0)
	ctx.clearRect(0, 300, 400, 800);

	zoomCanvas();

	var m = 50;
	ctx.beginPath();
	ctx.moveTo(0, 350 - m - My);
	ctx.lineTo(400, 350 + m - My);
	ctx.stroke();

	_ctx.drawImage(canvas, 0, 0);
	battle.ox = blox;
}
function drawEnemyView(My) {
	if (My >= 400) return;
	ctx.resetTransform();
	ctx.drawImage(_canvas, 0, 0);
	zoomCanvas();
}
function drawTurnTimer() {
	ctx.lineWidth = 8;
	ctx.fillStyle = yellow;
	ctx.fillRect(0, 50, 400, 50);
	ctx.fillStyle = green;
	ctx.fillRect(0, 50, 400 * .75, 50);
	ctx.strokeStyle = black;
	ctx.strokeRect(0, 50, 400, 50);
}
var battleButtons = {
	GREEN: 0,
	GREEN_AIR: 1
};
function drawAttackButtons() {
	ctx.fillStyle = '#8c3f5d';
	ctx.strokeStyle = black;
	ctx.fillRect(0, 600, 400, 200);
	ctx.strokeRect(0, 600, 400, 200);

	var a = 28;
	var b = a + 96;
	var y = 652;

	// ctx.drawImage(...green_buttons(0, 0), a + b, 600 + 52 - b, 96, 96);
	var [
		button0,
		button1,
		button2
	] = battle.buttonflags;

	var progress = (progress) => {
		var num = Math.round(progress * 16);
		var x = num % 6;
		var y = flr(num / 6);
		return green_button_progress(x, y);
	};
	var buttons = (x, y, button) => button.enabled ? green_buttons(x, y) : green_buttons_shaded(x, y);

	switch (battle.buttons) {
		default:
			ctx.drawImage(...buttons(0, 0, button0), a, y, 96, 96);
			if (button0.progress > 0) {
				ctx.drawImage(...progress(button0.progress), a, y, 96, 96);
			}

			a += b;
			ctx.drawImage(...buttons(1, 0, button1), a, y, 96, 96);
			if (button1.progress > 0) {
				ctx.drawImage(...progress(button1.progress), a, y, 96, 96);
			}

			a += b;
			ctx.drawImage(...buttons(2, 0, button2), a, y, 96, 96);
			if (button2.progress > 0) {
				ctx.drawImage(...progress(button2.progress), a, y, 96, 96);
			}
			break;
		case battleButtons.GREEN_AIR:
			ctx.drawImage(...buttons(2, 1, button0), a, y, 96, 96);
			ctx.drawImage(...buttons(1, 1, button1), a + b, y, 96, 96);
			ctx.drawImage(...buttons(0, 1, button2), a + b + b, y, 96, 96);
			break;
	}

	// ctx.drawImage(...green_buttons(2, 1), a, 600 + 52, 96, 96);
	// ctx.drawImage(...green_buttons(1, 1), a + b, 600 + 52, 96, 96);
	// ctx.drawImage(...green_buttons(0, 1), a + b + b, 600 + 52, 96, 96);
}
function blacksideBars() {
	ctx.resetTransform();
	ctx.fillStyle = black;
	ctx.fillRect(0, 0, game.x, game.h);
	ctx.fillRect(game.x + game.w + 1, 0, game.x, game.h);

	zoomCanvas();
	ctx.strokeStyle = black;
	ctx.strokeRect(0, 0, game.width, game.height);
}
function ButtonFlag() {
	this.down = null;

	this.press = 0;
	this.held = 0;
	this.release = 0;

	this.progress = 0;
	this.enabled = 0;

	this.setStatus = function (enabled, progress = (-1)) {
		this.enabled = enabled;
		this.progress = progress;
	};
}
var battle = {
	buttons: 0,
	buttonflags: [new ButtonFlag, new ButtonFlag, new ButtonFlag],
	ox: -128,
	my: 400,
	turn: 0,
	state: 2,
	update() {
		this.doButtonFlags();

		hitboxes.clear();
		if (battle.swipe == +1 && this.state < 2) {
			this.state += 1;
		}
		if (battle.swipe == -1 && this.state > 0) {
			this.state -= 1;
		}
		switch (battle.state) {
			case 0:
				{
					battle.ox = easeTo(battle.ox, 0, deltaTime);
					battle.my = easeTo(battle.my, 0, deltaTime * 2);
					break;
				}
			case 1: case 2: case 3:
				{
					battle.ox = easeTo(battle.ox, -128, deltaTime);
					battle.my = easeTo(battle.my, 400, deltaTime * 2);
					break;
				}
		}
		var battlers = [...allies, ...enemies];
		for (let battler of battlers) {
			battler.update();
		}

		for (let i = 0, l = hitboxes.length; i < l; i++) {
			let A = hitboxes.array[i];
			for (let j = i + 1; j < l; j++) {
				let B = hitboxes.array[j];
				if (Hitbox.shouldCollide(A, B) && Hitbox.isTouching(A, B)) {
					var AB = A.team & Hitbox.ATTACK && B.team & Hitbox.BODY;
					var BA = B.team & Hitbox.ATTACK && A.team & Hitbox.BODY;

					if (AB) {
						A.data.onHit();
						B.data.takeDamage();
					}
					if (BA) {
						B.data.onHit();
						A.data.takeDamage();
					}
				}
			}
		}
	},
	doButtonFlags() {
		hitboxes.clear();
		for (let flag of this.buttonflags) {
			flag.press = 0;
			flag.down = 0;
			flag.release = 0;
		}
		var button0 = hitboxes.new(Hitbox.BUTTON, 28, 652, 96, 96);
		var button1 = hitboxes.new(Hitbox.BUTTON, 152, 652, 96, 96);
		var button2 = hitboxes.new(Hitbox.BUTTON, 276, 652, 96, 96);

		var fullscreen = hitboxes.new(Hitbox.BUTTON, 200, 0, 200, 50);

		for (let [id, touch] of touches) {
			if (touch.dead) continue;

			var start = touch.getStart();
			var isTouching = button => Hitbox.pointInside(button, start) && Hitbox.pointInside(button, touch);
			if (isTouching(button0)) {
				press(this.buttonflags[0]);
			} else if (isTouching(button1)) {
				press(this.buttonflags[1]);
			} else if (isTouching(button2)) {
				press(this.buttonflags[2]);
			} else if (isTouching(fullscreen)) {
				canvas.requestFullscreen({ navigationUI: "show" });
			}
		}
		this.swipe = 0;
		for (let [id, touch] of touches) {
			if (!touch.dead || touch.used) continue;
			var start = touch.getStart();
			var dx = touch.x - touch.sx;
			var dy = touch.y - touch.sy;
			var adx = abs(dx);
			var ady = abs(dy);
			if (adx + ady < 60) continue;
			var m = 2.5;
			console.log(dx, dy);
			if (adx > ady * m) {
				if (dx > 0) this.swipe = +1;
				else this.swipe = -1;

				touch.used = 1;
			} else
				if (ady > adx * m) {
					if (dx > 0) this.swipe = +2;
					else this.swipe = -2;

					touch.used = 1;
				}
			touch.used = 1;
		}
		for (let flag of this.buttonflags) {
			if (flag.held && !flag.down) {
				flag.release = 1;
				flag.held = 0;
			}
		}
		function press(flag) {
			if (flag.held) {
				flag.held = 1;
				flag.down = 1;
			} else {
				flag.press = 1;
				flag.held = 1;
				flag.down = 1;
			}
		}
	}
};
var easeTo = (oldn, newn, speed = 1) => (Math.abs(oldn - newn) < speed) ? newn : (oldn + speed * Math.sign(newn - oldn));
var green = '#8fde5d';
var yellow = '#ffe478';
var lastFrame = 0;
var deltaTime = 0;
function main() {
	setTimeout(main, 20);
	deltaTime = Date.now() - lastFrame;
	lastFrame = Date.now();
	deltaTime = 20;

	resizeCanvas();
	clearCanvas();
	zoomCanvas();
	outlineFrame();

	battle.update();
	var My = battle.my;

	renderEnemyView(My);
	drawBackground();

	drawBattlers([...enemies, ...allies]);

	drawEnemyView(My);
	// drawHitboxes();
	zoomCanvas();

	drawTurnTimer();
	drawAttackButtons();

	blacksideBars();
	// drawFrameRate();
}
function drawFrameRate() {
	ctx.font = '20px Arial';
	ctx.fillStyle = black;
	ctx.fillText(deltaTime + "ms", 8, 32);
}
var isFullscreen = false;
var hitboxes = {
	/**@type {Hitbox[]}*/
	array: [],
	clear() {
		for (let i = 0; i < this.length; i++) {
			this.array[i].delete();
		}
		this.length = 0;
	},
	length: 0,
	get() {
		var i = this.length++;
		return this.array[i] || (this.array[i] = new Hitbox);
	},
	/**@type {_HSP}*/
	new(...params) { return this.get().setup(...params) },
	shouldCollide(a, b) { }
};
class Hitbox {
	setup(team, x, y, w, h, data) {
		this.team = team;
		this.x = x; this.y = y;
		this.w = w; this.h = h;
		this.x2 = x + w;
		this.y2 = y + h;
		this.data = data;
		return this;
	}
	draw() {
		if (!this.team) return;

		ctx.lineWidth = 2;
		if (this.team == Hitbox.BODY) {
			ctx.strokeStyle = 'blue';
		}
		if (this.team == Hitbox.ATTACK) {
			ctx.strokeStyle = 'red';
		}
		if (this.team == Hitbox.BODY + Hitbox.ATTACK) {
			ctx.strokeStyle = 'purple';
		}
		ctx.strokeRect(this.x, this.y, this.w, this.h);
	}
	delete() {
		this.team = 0;
	}
	static isTouching(A, B) {
		return B.x2 > A.x
			&& B.x < A.x2
			&& B.y2 > A.y
			&& B.y < A.y2
	}
	static pointInside(A, b) {
		return b.x > A.x
			&& b.x < A.x2
			&& b.y > A.y
			&& b.y < A.y2
	}
	static shouldCollide(A, B) {
		if (((A.team & this.BODY) && (B.team & this.ATTACK)) || ((B.team & this.BODY) && (A.team & this.ATTACK))) {
			return 1;
		}
	}
	static BODY = 1;
	static ATTACK = 2;
	static BUTTON = 4;
}
var _HSP = Hitbox.prototype.setup;
var State = {
	idle: 0,
	walk: 1,
	jump: 2,
	punch: 3,
	kick: 4,
	slam: 5,
	airPunch: 6,
	airKick: 7,
	attacked: 8
};
class Battler {
	constructor(i = 0, x = 0, y = 0) {
		this.i = i;
		this.x = x;
		this.y = y;
	}
	/**@type {Battler[]}*/
	team = [];
	health = {
		value: 10,
		max: 10
	};
	defense = 10;
	attack = 2;
	getVitality() {
		return this.mana.value / this.mana.max;
	};
	mana = {
		max: 10,
		value: 10
	};
	x = 0;
	y = 0;
	vy = 0;
	vx = 0;
	return = 0;
	imageSize = 16 * 4;
	attackTurn() {
		return (this.side > 0) ? 2 : 4;
	}
	update() {
		var { imageSize, i, side } = this;
		var [jump, punch, kick] = battle.buttonflags;
		i = abs(i);
		var x = this.getScreenX();
		var y = this.getScreenY();
		var X = x, Y = y;

		var idleTimer = (Date.now() % 600);
		if (idleTimer < 300) this.image = green_images.idle0;
		else this.image = green_images.idle1;
		this.flip = false;

		//add hitbox flipping
		var Attack = this.attackTurn();
		var useButtons = side == 1;
		var fix = (x, w) => {
			if (side == 1) return x;
			else return flipCoord(x, w);
		};
		var flipCoord = (x, w) => 64 - x - w;
		var makeHitbox = (team, x, y, w, h) => hitboxes.new(team, X + fix(x, w), Y + y, w, h, this);
		var bodyBox = (x, y, w, h) => makeHitbox(Hitbox.BODY + Hitbox.ATTACK, x, y, w, h, this);
		var doAttack = (x, y, w, h) => makeHitbox(Hitbox.ATTACK, x, y, w, h, this);
		var defaultHitbox = () => {
			bodyBox(16, 0, 32, 64);
		};

		if (i == 1) {
			if (useButtons) {
				jump.setStatus(0);
				punch.setStatus(0);
				kick.setStatus(0);
			}
			var a = 0;
			var c = 0;
			var before = n => {
				c = a;
				a += n;
				return this.tick < a;
			};
			var exit = () => this.tick + this.tickRate >= a;
			if(useButtons) battle.buttons = battleButtons.GREEN;
			var homeBase = (side == 1) ? 0 : (400 - imageSize);
			var fx = this.x - homeBase;

			//return to base
			{
				if ((sign(fx) != sign(fx + this.vx)) && (this.state == State.idle || this.state == State.walk)) {
					this.stateChange(State.idle);
					this.x = homeBase;
					this.vx = 0;
				}
			}

			this.tick += this.tickRate;
			var gravity = 0.5;
			switch (this.state) {
				case State.idle:
					{
						defaultHitbox();
						this.vx = 0;
						this.vy = 0;

						if (battle.state == Attack || fx) {
							this.stateChange(State.walk);
						}
						if (useButtons) {
							if (!this.return) {
								jump.setStatus(1);
								punch.setStatus(1);
								kick.setStatus(1);

								if (punch.press) this.stateChange(State.punch);
								if (kick.press) this.stateChange(State.kick);
								if (jump.press) this.stateChange(State.jump);
							}
						}
						break;
					}
				case State.walk:
					{
						defaultHitbox();
						if (battle.state == Attack && !this.return) {
							this.vx = +4;
						} else {
							if (fx * side > 0) {
								this.vx = -6;
							} else if (fx == 0) {
								this.stateChange(State.idle);
								this.vx = 0;
							} else {
								this.vx = +10;
							}
						}
						var walkSpeed = 1.5;
						this.moveX(this.vx);
						this.flip = this.vx < 0;
						var f = flr(((this.tick * walkSpeed) % 8) / 2);
						this.image = green_images["walk" + f];

						if (useButtons) {
							if (!this.return) {
								jump.setStatus(1);
								punch.setStatus(1);
								kick.setStatus(1);

								if (punch.press) this.stateChange(State.punch);
								if (kick.press) this.stateChange(State.kick);
								if (jump.press) this.stateChange(State.jump);
							}
						}
						break;
					}
				case State.jump:
					{
						this.y -= this.vy;
						this.moveX(this.vx);

						if (this.y < 0) {
							this.vy -= gravity;
							battle.buttons = battleButtons.GREEN_AIR;
						} else {
							if (punch.press) this.stateChange(State.punch, 0, 2);
							if (kick.press) this.stateChange(State.kick, 0, 2);
							punch.setStatus(1);
							kick.setStatus(1);
							this.vy = 0;
							this.y = 0;
						}
						if (before(2)) {
							this.image = green_images.jump0;
						} else if (before(3)) {
							this.image = green_images.jump1;
							this.moveX(-.5 * this.vx);
							punch.setStatus(1, 1 - (this.tick - c) / 3);
							kick.setStatus(1, 1 - (this.tick - c) / 3);
							if (exit()) {
								this.vy = 12;
							}
						} else if (this.y) {
							this.image = green_images.jump2;
							this.tick = a;

							if (jump.press) this.stateChange(State.slam);
							if (punch.press) this.stateChange(State.airPunch);
							if (kick.press) this.stateChange(State.airKick);
							jump.setStatus(1);
							punch.setStatus(1);
							kick.setStatus(1);
						} else if (before(3)) {
							this.image = green_images.jump3;
						} else {
							this.stateChange(State.idle);
						}
						defaultHitbox();
						break;
					}
				case State.punch:
					{
						let endEarly = () => {
							if (exit()) {
								if (!this.hitType) {
									this.tick = 14;
								} else {
									this.hitType = 0;
								}
							}
						};
						let needsPress = () => {
							punch.setStatus(1, 1 - (this.tick - c)/2);
							if (punch.press) this.hitType = 1;
						};
						let kickTransition = () => {
							kick.setStatus(1);
							if (kick.held) {
								this.image = green_images.kick1;
								this.stateChange(State.kick, 0, 2);
							}
						};
						let exitKick = () => {
							kick.setStatus(1);
							if (exit() && this.hitType) {
								kickTransition();
							}
						};
						let punchHitbox = () => {
							jump.setStatus(0);
							kick.setStatus(0);
							prepPunch();
							return doAttack(48, 20, 28, 16);
						};
						let prepPunch = () => {
							punch.setStatus(0, (this.tick - c)/2);
						};

						defaultHitbox();
						if (before(2)) {
							this.moveX(this.vx);
							this.image = green_images.punch0;
							this.hitType = 0;
							prepPunch();
						} else if (before(2)) {
							this.image = green_images.punch1;
							needsPress();
						} else if (before(2)) {
							this.image = this.hitType ? green_images.punch2 : green_images.punch3;
							punchHitbox();
							endEarly();
							exitKick();
						} else if (before(2)) {
							this.image = green_images.punch4;
							needsPress();
							kickTransition();
						} else if (before(2)) {
							this.image = this.hitType ? green_images.punch5 : green_images.punch6;
							punchHitbox();
							endEarly();
							exitKick();
						} else if (before(2)) {
							this.image = green_images.punch7;
							needsPress();
							kickTransition();
						} else if (before(2)) {
							this.image = this.hitType ? green_images.punch8 : green_images.punch9;
							punchHitbox();
						} else if (before(2)) {
							this.image = green_images.punch10;
						} else {
							this.image = green_images.punch10;
							this.stateChange(State.idle);
							this.goBack();
						}
						break;
					}
				case State.kick:
					{
						defaultHitbox();
						let earlyCheck = () => {
							kick.setStatus(0, 1 - this.tick/6);
							if (kick.release) this.tick = 8;
						}
						if (before(2)) {
							this.moveX(this.vx);
							this.image = green_images.kick0;
							this.hitType = 0;
							earlyCheck();
						} else if (before(4)) {
							this.image = green_images.kick1;
							earlyCheck();
						} else if (before(2)) {
							this.image = green_images.kick2;
							kick.setStatus(1, (this.tick - 6)/2);
							if (kick.release) {
								this.hitType = 1;
							}
						} else if (before(2)) {
							this.image = green_images.kick3;
						} else if (before(2)) {
							this.image = this.hitType ? green_images.kick4 : green_images.kick5;
							doAttack(48, 28, 24, 20);
						} else if (before(2)) {
							this.image = green_images.kick6;
						} else {
							this.image = green_images.kick6;
							this.stateChange(State.idle);
							this.goBack();
						}
						break;
					}
				case State.slam:
					{
						defaultHitbox();
						this.y -= this.vy;

						if (before(2)) {
							this.moveX(this.vx);
							this.image = green_images.slam0;
						} else {
							this.vy = -10;
							this.image = green_images.slam1;
							doAttack(24, 64, 32, 16);
						}
						if (this.y < 0) {
							battle.buttons = battleButtons.GREEN_AIR;
							if (this.hasHit) {
								this.vx = -5;
								this.vy = 5;
								this.stateChange(State.jump, 0, 5);
								this.goBack();
							}
						} else {
							this.stateChange(State.jump, 0, 5);
							this.goBack();
						}
						break;
					}
				case State.airPunch:
					{
						defaultHitbox();
						this.y -= this.vy;
						this.moveX(this.vx);

						if (this.y < 0) {
							this.vy -= gravity;
							battle.buttons = battleButtons.GREEN_AIR;
						} else {
							this.stateChange(State.jump, 0, 5);
							this.goBack();
						}
						if (before(2)) {
							this.image = green_images.aPunch0;
						} else if (before(2)) {
							this.image = green_images.aPunch1;
							doAttack(48, 16, 20, 24);
						} else if (before(2)) {
							this.image = green_images.aPunch2;
						} else {
							this.image = green_images.slam2;
						}
						break;
					}
				case State.airKick:
					{
						defaultHitbox();
						this.y -= this.vy;
						this.moveX(this.vx);

						if (this.y < 0) {
							this.vy -= gravity;
							battle.buttons = battleButtons.GREEN_AIR;
						} else {
							this.stateChange(State.jump, 0, 5);
							this.goBack();
						}
						if (before(2)) {
							this.image = green_images.aKick0;
						} else if (before(2)) {
							this.image = green_images.aKick1;
							doAttack(48, 32, 20, 24);
						} else {
							this.image = green_images.aKick2;
						}
						break;
					}
				case State.attacked:
					{
						if (this.tick == this.tickRate) {
							this.vx = 0;
							this.vy = 0;
							if (this.y) {
								this.vy = 3;
							}
						}
						if (this.y < 0) {
							var air = 1;
							this.vy -= gravity;
						} else {
							this.y = 0;
							this.vy = 0;
						}
						this.moveX(-1);
						this.y -= this.vy;
						if (air) {
							if (before(2)) {
								this.image = green_images.attacked4;
							} else if (this.y) {
								this.image = green_images.slam2;
							}
						} else {
							if (before(2)) {
								this.image = green_images.attacked1;
							} else {
								this.stateChange(State.idle);
								this.goBack();
							}
						}
						break;
					}
			}
		}
		this.hasHit = 0;
	}
	takeDamage() {
		this.stateChange(State.attacked);
	}
	onHit() {
		this.hasHit = 1;
	}
	hasHit = 0;
	get side() {
		return sign(this.i);
	}
	moveX(x) {
		this.x += this.side * x;
	}
	goBack() {
		if (battle.state == this.attackTurn()) {
			battle.state -= 1;
		}
	}
	stateChange(state, phase = 0, tick = 0) {
		this.state = state ?? this.state;
		this.phase = phase ?? this.phase;
		this.tick = tick ?? this.tick;
	}
	flip = false;
	hitType = 0;
	state = 0;
	phase = 0;
	tick = 0;
	tickRate = 1 / 5;
	getScreenX() {
		return this.x + 128;
	}
	getScreenY() {
		return this.y + 428;
	}
	draw() {
		var { imageSize, i } = this;
		var side = sign(i);
		var flip = side - 1;
		if (this.flip) {
			flip = !flip;
		}
		var testImage = this.image;
		i = abs(i);
		var x = this.getScreenX();
		var y = this.getScreenY();

		var o = 0.3;
		var u = i - 1;
		x += side * (cos(o + u * PI / 2) - cos(o)) * imageSize * 0.8;
		y += (sin(o + u * PI / 2) - sin(o)) * imageSize * 0.9;
		if (flip) {
			ctx.translate(x, 0);
			ctx.scale(-1, 1);
			ctx.drawImage(testImage, 0, y, -imageSize, imageSize);
			ctx.scale(-1, 1);
			ctx.translate(-x, 0);
		} else {
			ctx.drawImage(testImage, x, y, imageSize, imageSize);
		}
	}
}

var A = 400 - 16 * 4;

var allies = [new Battler(1, 0), new Battler(2, 0), new Battler(3, 0), new Battler(4, 0)];
var enemies = [new Battler(-1, A), new Battler(-2, A), new Battler(-3, A), new Battler(-4, A)];

for (let battler of allies) battler.team = allies;
for (let battler of enemies) battler.team = enemies;
