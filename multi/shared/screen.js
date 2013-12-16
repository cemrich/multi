/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


/**
 * This module contains all classes and utils that are useful
 * for working with multiple screens. Currently that's only the 
 * {@link module:shared/screen.ScreenArranger ScreenArranger}.
 * @module shared/screen
 */
define(function(require, exports, module) {

	exports.Screen = function (x, y, player) {
		this.width = player.width;
		this.height = player.height;
		this.player = player;
		this.x = x;
		this.y = y;
		this.prevScreen = null;
		this.nextScreen = null;
	}

	/**
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {boolean}  true if the given global coordinates lie inside 
	 * the this screen object, else false
	 * @private
	 */
	exports.Screen.prototype.isHit = function (x, y) {
		return x >= this.x &&
			x < this.x + this.width &&
			y >= this.y &&
			y < this.y + this.height;
	};

	exports.Screen.prototype.isHitByRect = function (x, y, width, height) {
		return x + width > this.x &&
			y + height > this.y &&
			x < this.x + this.width &&
			y < this.y + this.height; 
	};

	exports.Screen.prototype.localToGlobal = function (x, y) {
		return { x: this.x + x, y: this.y + y };
	};

	exports.Screen.prototype.globalToLocal = function (x, y) {
		return { x: x - this.x, y: y - this.y, player: this.player };
	};


	/**
	 * @classdesc This class can be used to arrange multiple clients
	 * into one big game screen. It does rearrange every time a player
	 * joins or leaves the given session.<br>
	 * You can influence the behaviour by using this class as the base
	 * of your own Arranger class.
	 * @class
	 * @param {module:client/session~Session|module:server/session~Session}
	 *  Session that contains the players that should be arranged into
	 *  one big screen.
	 */
	exports.ScreenArranger = function (session) {
		/**
		 * Session that is getting arranged into one big game screen
		 * @type {module:client/session~Session|module:server/session~Session}
		 * @readonly
		 */
		this.session = session;
		/**
		 * Contains one screen object for every player id
		 * A screen object consists of player, x and y attributes.
		 * @type {Object.<string, object>}
		 * @private
		 */
		this.screens = {};
		/**
		 * total width of the big screen in pixel
		 * @type {integer}
		 * @readonly
		 */
		this.width = 0;
		/**
		 * total height of the big screen in pixel
		 * @type {integer}
		 * @readonly
		 */
		this.height = 0;

		this.arrange();
		session.on('playerJoined', this.onPlayerJoined.bind(this));
		session.on('playerLeft', this.onPlayerLeft.bind(this));
	};

	/**
	 * @param  {integer} x  current global x position in pixel
	 * @param  {integer} y  current global y position in pixel
	 * @param  {integer} step  number of pixels you want to move
	 * @return {object}  the new global position after moving step pixels
	 *  to the top. Values lower than zero will continue on the bottom.
	 */
	exports.ScreenArranger.prototype.getUp = function (x, y, step) {
		var newY = y - step;
		if (newY < 0) {
			newY = this.height + newY;
		}
		return { x: x, y: newY };
	};

	/**
	 * @param  {integer} x  current global x position in pixel
	 * @param  {integer} y  current global y position in pixel
	 * @param  {integer} step  number of pixels you want to move
	 * @return {object}  the new global position after moving step pixels
	 *  to the right. Values greater than the total width will continue
	 *  on the left side.
	 */
	exports.ScreenArranger.prototype.getRight = function (x, y, step) {
		var newX = x + step;
		if (newX >= this.width) {
			newX = this.width - newX;
		}
		return { x: newX, y: y };
	};

	/**
	 * @param  {integer} x  current global x position in pixel
	 * @param  {integer} y  current global y position in pixel
	 * @param  {integer} step  number of pixels you want to move
	 * @return {object}  the new global position after moving step pixels
	 *  to the bottom. Values lower than the total height will continue
	 *  on the top.
	 */
	exports.ScreenArranger.prototype.getDown = function (x, y, step) {
		var newY = y + step;
		if (newY >= this.height) {
			newY = newY - this.height;
		}
		return { x: x, y: newY };
	};

	/**
	 * @param  {integer} x  current global x position in pixel
	 * @param  {integer} y  current global y position in pixel
	 * @param  {integer} step  number of pixels you want to move
	 * @return {object}  the new global position after moving step pixels
	 *  to the left. Values lower than zero will continue on the right side.
	 */
	exports.ScreenArranger.prototype.getLeft = function (x, y, step) {
		var newX = x - step;
		if (newX < 0) {
			newX = this.width + newX;
		}
		return { x: newX, y: y };
	};

	/**
	 * Converts local pixel coordinates to global ones.
	 * @param  {module:server/player~Player|module:client/player~Player} player 
	 * player instance the local coordinates refer to
	 * @param  {integer} x  local x position in pixel
	 * @param  {integer} y  local y position in pixel
	 * @return {object}  { x: globalX, y: globalY } or null if the given
	 *  player is no part of this arranger
	 */
	exports.ScreenArranger.prototype.localToGlobal = function (player, x, y) {
		return player.screen.localToGlobal(x, y);
	};

	exports.ScreenArranger.prototype.globalRectToLocals = function (x, y, width, height) {
		var locals = {};
		var local, screen;
		for (var i in this.session.players) {
			screen = this.session.players[i].screen;
			if (screen !== null && screen.isHitByRect(x, y, width, height)) {
				locals[screen.player.id] = screen.globalToLocal(x, y);
			}
		}

		return locals;
	};

	/**
	 * @param  {module:server/player~Player|module:client/player~Player} player 
	 * any player object connected to the arranged session
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {boolean}  true if the given coordinates lie within
	 * the screen of the given player
	 */
	exports.ScreenArranger.prototype.isPlayerHit = function (player, x, y) {
		return player.screen.isHit(x, y);
	};

	exports.ScreenArranger.prototype.getScreenAtCoords = function (x, y) {
		for (var i in this.session.players) {
			var screen = this.session.players[i].screen;
			if (screen.isHit(x, y)) {
				return screen;
			}
		}
		return null;
	};

	/**
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {module:server/player~Player|module:client/player~Player}
	 * player object whose screen lies beneath the given coordinates
	 * or null when no player can be found at this position
	 */
	exports.ScreenArranger.prototype.getPlayerAtCoords = function (x, y) {
		var screen = this.getScreenAtCoords(x, y);
		if (screen === null) {
			return null;
		} else {
			return screen.player;
		}
	};

	/**
	 * Rearranges the screens of all players currently connected to
	 * the arranged session. Width, height and other attributes
	 * will be recalculated and may change.
	 * @private
	 */
	exports.ScreenArranger.prototype.arrange = function () {
		var height = 0;
		var xPos = 0;
		var lastPlayer = null;
		this.session.getPlayerArray().forEach(function (player) {
			player.screen = new exports.Screen(xPos, 0, player);
			if (lastPlayer != null) {
				player.screen.lastScreen = lastPlayer.screen;
				lastPlayer.screen.nextScreen = player.screen;
			}
			height = Math.max(height, player.height);
			xPos += player.width;
			lastPlayer = player;
		});

		this.width = xPos;
		this.height = height;
	};

	exports.ScreenArranger.prototype.onPlayerJoined = function (event) {
		this.arrange();
	};

	exports.ScreenArranger.prototype.onPlayerLeft = function (event) {
		this.arrange();
	};

	return exports;

});