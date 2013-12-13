/* global exports */

var multiModule = require('../multi/server');
var ScreenArranger = require('../multi/shared/screen').ScreenArranger;


exports.Game = function (session) {

	var snakes = [];

	function Segment(startX, startY) {
		this.startX = startX;
		this.startY = startY;
		this.x = startX;
		this.y = startY;
		this.getWidth = function () {
			return this.x - this.startX;
		};
		this.getHeight = function () {
			return this.y - this.startY;
		};
	}

	function Snake (owner) {
		this.owner = owner;

		// start at center of display (global coords)
		var display = owner;
		var localX = Math.round(display.width / 2);
		var localY = Math.round(display.height / 2);

		this.speed = 5;
		this.pos = arranger.localToGlobal(display, localX, localY);
		this.lastPos = null;
		this.dir = -1;
		this.lastDir = -1;
		this.curSegment = new Segment(this.pos.x, this.pos.y);
		this.segments = [this.curSegment];

		this.update = function () {
			this.move();
			this.updateDisplay();
		};

		this.move = function () {
			this.lastDir = this.dir;
			this.lastPos = this.pos;
			this.dir = owner.attributes.direction || 0;
			switch (this.dir) {
			case 0:
				this.pos = arranger.getUp(this.pos.x, this.pos.y, this.speed);
				break;
			case 1:
				this.pos = arranger.getRight(this.pos.x, this.pos.y, this.speed);
				break;
			case 2:
				this.pos = arranger.getDown(this.pos.x, this.pos.y, this.speed);
				break;
			case 3:
				this.pos = arranger.getLeft(this.pos.x, this.pos.y, this.speed);
				break;
			}

			if (this.dir !== this.lastDir) {
				// direction changed - start a new segment
				this.curSegment = new Segment(this.lastPos.x, this.lastPos.y);
				this.segments.push(this.curSegment);
			}
			// TODO: local screen boundary - create a new segment

			// update current segment
			this.curSegment.x = this.pos.x;
			this.curSegment.y = this.pos.y;
		};

		this.updateDisplay = function () {
			var width = this.curSegment.getWidth();
			var height = this.curSegment.getHeight();
			var locals = arranger.globalToLocals(this.curSegment.startX,
				this.curSegment.startY, width, height);
			var local;
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
		snakes.forEach(function (snake) {
			snake.update();
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