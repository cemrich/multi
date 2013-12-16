/* global exports */

var multiModule = require('../../multi/server');
var ScreenArranger = require('../../multi/shared/screen').ScreenArranger;


exports.Game = function (session) {

	var snakes = [];

	function Segment(startX, startY) {
		this.startX = startX;
		this.startY = startY;
		this.x = startX;
		this.y = startY;
		this.getWidth = function () {
			return Math.abs(this.x - this.startX);
		};
		this.getHeight = function () {
			return Math.abs(this.y - this.startY);
		};
		this.getTop = function () {
			return this.y - this.startY < 0 ? this.y : this.startY;
		};
		this.getLeft = function () {
			return this.x - this.startX < 0 ? this.x : this.startX;
		};
	}

	function Snake (owner) {
		this.owner = owner;

		// start at center of display (global coords)
		var display = owner;
		var localX = Math.round(display.width / 2);
		var localY = Math.round(display.height / 2);

		this.speed = 5;
		this.dir = -1;
		this.lastDir = -1;

		var initialPos = display.screen.localToGlobal(localX, localY);
		this.curSegment = new Segment(initialPos.x, initialPos.y);
		this.segments = [this.curSegment];

		this.update = function () {
			this.move();
			this.updateDisplay();
		};

		this.move = function () {
			this.lastDir = this.dir;
			this.dir = owner.attributes.direction || 0;

			if (this.dir !== this.lastDir) {
				// direction changed - start a new segment
				this.curSegment = new Segment(this.curSegment.x, this.curSegment.y);
				this.segments.push(this.curSegment);
			}

			switch (this.dir) {
			case 0:
				this.curSegment.y -= this.speed;
				break;
			case 1:
				this.curSegment.x += this.speed;
				break;
			case 2:
				this.curSegment.y += this.speed;
				break;
			case 3:
				this.curSegment.x -= this.speed;
				break;
			}
		};

		this.isAlive = function () {
			return arranger.getPlayerAtCoords(this.curSegment.x, this.curSegment.y)
				!== null;
		};

		this.updateDisplay = function () {
			var width = this.curSegment.getWidth();
			var height = this.curSegment.getHeight();
			var left = this.curSegment.getLeft();
			var top = this.curSegment.getTop();
			var locals = arranger.globalRectToLocals(left, top, width, height);
			for (var i in locals) {
				local = locals[i];
				this.owner.message('draw',
					{
						x: local.x,
						y: local.y,
						width: width,
						height: height
					},
					local.player);
			}
		};
	}

	function move() {
		var dead = [];
		snakes.forEach(function (snake) {
			snake.update();
			if (!snake.isAlive()) {
				dead.push(snake);
			}
		});
		dead.forEach(function (snake) {
			snakes.splice(snakes.indexOf(snake), 1);
		});
	}

	function onPlayerJoined(event) {
		event.player.attributes.color = multiModule.color.random();
	}

	function onStartGame() {
		for (var i in session.players) {
			snakes.push(new Snake(session.players[i]));
		}
		// very, very simple gameloop for the start
		setInterval(function () {
			move();
		}, 100);
		// session.message('finished');
	}

	var arranger = new ScreenArranger(session);
	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);

};