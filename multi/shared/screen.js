/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


/**
 * 
 * @module
 */
define(function(require, exports, module) {

	/**
	 * @class
	 */
	var ScreenArranger = function (session) {
		this.session = session;
		this.screens = {};
		this.width = 0;
		this.height = 0;
		this.arrange();
		session.on('playerJoined', this.onPlayerJoined.bind(this));
		session.on('playerLeft', this.onPlayerLeft.bind(this));
	};

	ScreenArranger.prototype.isScreenHit = function (screen, x, y) {
		return x >= screen.left &&
			x < screen.left + screen.player.width &&
			y >= screen.top &&
			y < screen.top + screen.player.height;
	};

	ScreenArranger.prototype.isPlayerHit = function (player, x, y) {
		return this.isScreenHit(this.screens[player.id], x, y);
	};

	ScreenArranger.prototype.getPlayerAtCoords = function (x, y) {
		for (var i in this.screens) {
			var screen = this.screens[i];
			if (this.isScreenHit(screen, x, y)) {
				return screen.player;
			}
		}
		return null;
	};

	ScreenArranger.prototype.arrange = function () {
		var screens = {};
		var height = 0;
		var xPos = 0;
		this.session.getPlayerArray().forEach(function (player) {
			screens[player.id] = {
				top: 0,
				left: xPos,
				player: player
			};
			height = Math.max(height, player.height);
			xPos += player.width;
		});

		this.screens = screens;
		this.width = xPos;
		this.height = height;
	};

	ScreenArranger.prototype.onPlayerJoined = function (event) {
		this.arrange();
	};

	ScreenArranger.prototype.onPlayerLeft = function (event) {
		this.arrange();
	};

	exports.ScreenArranger = ScreenArranger;
	return exports;

 });