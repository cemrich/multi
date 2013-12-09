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
			var local = arranger.globalToLocal(this.pos.x, this.pos.y);
			if (local !== null) {
				var drawObj = {
					playerId: this.owner.id,
					x: local.x,
					y: local.y
				};
				local.player.message('draw', drawObj, local.player);
			}
		};
	}

	function move() {
		snakes.forEach(function (snake) {
			snake.update();
		});
	}

	function onPlayerJoined(event) {
		// TODO: cannot send messages here
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