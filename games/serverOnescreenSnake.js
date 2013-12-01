/* global exports */

var multiModule = require('../multi/server');
var ScreenArranger = require('../multi/shared/screen').ScreenArranger;


exports.Game = function (session) {

	var snakes = [];

	function Snake (owner) {
		this.owner = owner;

		// start at center of display (global coords)
		var display = owner;
		var localX = Math.round(display.width / 2);
		var localY = Math.round(display.height / 2);

		this.speed = 5;
		this.pos = arranger.localToGlobal(display, localX, localY);
		this.dir = -1;

		this.update = function () {
			this.move();
			this.updateDisplay();
		};

		this.move = function () {
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
		};

		this.updateDisplay = function () {
			var local = arranger.globalToLocal(this.pos.x, this.pos.y);
			if (local !== null) {
				var drawObj = {
					playerId: this.owner.id,
					x: local.x,
					y: local.y
				};
				local.player.message('draw', drawObj);
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