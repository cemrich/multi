/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }

/**
 * This module contains classes and utils that are useful
 * for working with multiple screens. To use a ScreenArranger inside your
 * game look up the 
 * {@link module:plugins/screens.HorizontalArranger|HorizontalArranger}
 * documentation.
 * @module plugins/screens
 */
define(function(require, exports, module) {
	'use strict';

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');

	/**
	 * @classdesc When any ScreenArranger is used, an instance of this 
	 * class will be added to every player. Here you can find all
	 * information and helper methods relevant for positioning one 
	 * screen on a bigger playing field.
	 * @class
	 * @param {module:shared/player~Player} 
	 *  player player instance this screen is added to
	 */
	exports.Screen = function (player) {
		/**
		 * width of the screen in pixel
		 * @type {integer}
		 */
		this.width = player.width;
		/**
		 * height of the screen in pixel
		 * @type {integer}
		 */
		this.height = player.height;
		/**
		 * player instance this screen is added to
		 * @type {module:shared/player~Player}
		 */
		this.player = player;
		/**
		 * global x-position (from left) of this screen in pixel
		 * @type {integer}
		 */
		this.x = null;
		/**
		 * global x-position (from top) of this screen in pixel
		 * @type {integer}
		 */
		this.y = null;
		/**
		 * list of all player instances that border on the right
		 * side of this screen
		 * @type {Array}
		 */
		this.rightPlayers = [];
		/**
		 * list of all player instances that border on the left
		 * side of this screen
		 * @type {Array}
		 */
		this.leftPlayers = [];
		/**
		 * list of all player instances that border on the top
		 * of this screen
		 * @type {Array}
		 */
		this.topPlayers = [];
		/**
		 * list of all player instances that border on the bottom
		 * of this screen
		 * @type {Array}
		 */
		this.bottomPlayers = [];
	};

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

	/**
	 * @param  {integer}  x      global x-coordinate of the upper left corner
	 *  of the rectangle in pixel
	 * @param  {integer}  y      global y-coordinate of the upper left corner
	 *  of the rectangle in pixel
	 * @param  {integer}  width  width of the rectangle in pixel
	 * @param  {integer}  height height of the rectangle in pixel
	 * @return {boolean}         true if the given rectangle or parts of it 
	 *  overlap with this screen
	 */
	exports.Screen.prototype.isHitByRect = function (x, y, width, height) {
		return x + width >= this.x &&
			y + height >= this.y &&
			x < this.x + this.width &&
			y < this.y + this.height;
	};

	/**
	 * Converts local pixel coordinates to global ones, using this screen
	 * as local coordinate system.
	 * @param  {integer} x  local x position in pixel
	 * @param  {integer} y  local y position in pixel
	 * @return {object}  { x: globalX, y: globalY }
	 */
	exports.Screen.prototype.localToGlobal = function (x, y) {
		return { x: this.x + x, y: this.y + y };
	};

	/**
	 * Converts global pixel coordinates to local ones, using this screen
	 * as local coordinate system.
	 * @param  {integer} x  global x position in pixel
	 * @param  {integer} y  global y position in pixel
	 * @return {object}  { x: localX, y: localY, player: this.player }
	 */
	exports.Screen.prototype.globalToLocal = function (x, y) {
		return { x: x - this.x, y: y - this.y, player: this.player };
	};


	/**
	 * @classdesc This is the base class for arranging players of the given
	 * session to one big playing field. It will add a 
	 * {@link module:plugins/screens.Screen|screen} attribute to every joined 
	 * player.<br><br>
	 * Feel free to extend this class to create your own ScreenArranger. You
	 * can use {@link module:plugins/screens.HorizontalArranger} 
	 * as example implementation.
	 * @class
	 * @mixes external:EventEmitter
	 * @param {module:shared/session~Session}
	 *  Session that contains the players that should be arranged into
	 *  one big screen.
	 */
	exports.ScreenArranger = function (session) {

		EventEmitter.call(this);

		/**
		 * Session that is getting arranged into one big game screen
		 * @type {module:shared/session~Session}
		 * @readonly
		 */
		this.session = session;
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

		// add a screen to every player...
		session.getPlayerArray().forEach(function (player) {
			player.screen = new exports.Screen(player);
		});
		this.refresh();

		// ...and every player that will come
		session.on('playerJoined', this.onPlayerJoined.bind(this));
		session.on('playerLeft', this.onPlayerLeft.bind(this));
	};

	util.inherits(exports.ScreenArranger, EventEmitter);

	/**
	 * Converts local pixel coordinates to global ones.
	 * @param  {module:shared/player~Player} player 
	 *  player instance the local coordinates refer to
	 * @param  {integer} x  local x position in pixel
	 * @param  {integer} y  local y position in pixel
	 * @return {object}  { x: globalX, y: globalY } or null if the given
	 *  player is no part of this arranger
	 */
	exports.ScreenArranger.prototype.localToGlobal = function (player, x, y) {
		return player.screen.localToGlobal(x, y);
	};

	/**
	 * Determines which Player overlaps with the given rectangle.
	 * @param  {integer}  x      global x-coordinate of the upper left corner
	 *  of the rectangle in pixel
	 * @param  {integer}  y      global y-coordinate of the upper left corner
	 *  of the rectangle in pixel
	 * @param  {integer}  width  width of the rectangle in pixel
	 * @param  {integer}  height height of the rectangle in pixel
	 * @return {Array}    list of local objects of the form 
	 *  { x: localX, y: localY, player: hitPlayer }. X and y are the upper-left
	 *  corner of the given rectangle in the players local coordinate system.
	 * @see module:plugins/screens.Screen#globalToLocal
	 * @see module:plugins/screens.Screen#isHitByRect
	 */
	exports.ScreenArranger.prototype.globalRectToLocals = function (x, y, width, height) {
		var locals = {};
		var screen;
		for (var i in this.session.players) {
			screen = this.session.players[i].screen;
			if (screen.isHitByRect(x, y, width, height)) {
				locals[screen.player.id] = screen.globalToLocal(x, y);
			}
		}

		return locals;
	};

	/**
	 * Determines which Player overlaps with the given point and returns
	 * it in his local coordinates.
	 * @param  {integer}  x      global x-coordinate of in pixel
	 * @param  {integer}  y      global y-coordinate of in pixel
	 * @return {object|null}     local object of the form 
	 *  { x: localX, y: localY, player: hitPlayer } or null.
	 * @see module:plugins/screens.Screen#globalToLocal
	 */
	exports.ScreenArranger.prototype.globalToLocal = function (x, y) {
		var player = this.getPlayerAtCoords(x, y);
		if (player === null) {
			return null;
		} else {
			return player.screen.globalToLocal(x, y);
		}
	};

	/**
	 * @param  {module:shared/player~Player} player 
	 *  any player object connected to the arranged session
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {boolean}  true if the given coordinates lie within
	 * the screen of the given player
	 */
	exports.ScreenArranger.prototype.isPlayerHit = function (player, x, y) {
		return player.screen.isHit(x, y);
	};

	/*
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {boolean}  true if the given coordinates lie within
	 * the screen of any player, false otherwise
	 */
	exports.ScreenArranger.prototype.isAnyPlayerHit = function (x, y) {
		return this.getPlayerAtCoords(x, y) !== null;
	};

	/**
	 * @param  {integer}  x  global x position in pixel
	 * @param  {integer}  y  global y position in pixel
	 * @return {module:shared/player~Player}
	 *  player object whose screen lies beneath the given coordinates
	 *  or null when no player can be found at this position
	 */
	exports.ScreenArranger.prototype.getPlayerAtCoords = function (x, y) {
		for (var i in this.session.players) {
			var screen = this.session.players[i].screen;
			if (screen.isHit(x, y)) {
				return screen.player;
			}
		}
		return null;
	};

	/**
	 * This method by default gets called whenever a new player joins
	 * the underlying session. It calls
	 * {@link module:plugins/screens.ScreenArranger#arrange|arrange} and 
	 * {@link module:plugins/screens.ScreenArranger#recaculateDimentions|recaculateDimentions}. <br>
	 * You can override this method to write your own screen arranger.
	 * In this case please make sure to arrange every player and 
	 * update the dimentions of the whole playing field accordingly.
	 */
	exports.ScreenArranger.prototype.refresh = function () {
		this.arrange();
		this.recaculateDimentions();
		this.emit('arrangementChanged');
	};

	/**
	 * This method is called by the 
	 * {@link module:plugins/screens.ScreenArranger#refresh|refresh} 
	 * method by default. It takes the global position and dimentions of every 
	 * player into account to update the global playing field width and height 
	 * accordingly.<br>
	 * You may override this method or call it from any overridden method.
	 */
	exports.ScreenArranger.prototype.recaculateDimentions = function () {
		var maxX = 0;
		var maxY = 0;
		this.session.getPlayerArray().forEach(function (player) {
			maxX = Math.max(maxX, player.screen.x + player.screen.width);
			maxY = Math.max(maxY, player.screen.y + player.screen.height);
		});
		this.width = maxX;
		this.height = maxY;
	};

	/**
	 * This method is called by the 
	 * {@link module:plugins/screens.ScreenArranger#refresh|refresh} method by default. 
	 * It does  nothing for this base class and should be overridden by every 
	 * child class.<br><br>
	 * Please make sure to update the positions of every players screen here.
	 * @abstract
	 */
	exports.ScreenArranger.prototype.arrange = function () {
		// this does nothing!
	};

	/**
	 * This method is callen whenever a new player joins the session.
	 * Feel free to override. In this case you may want to create a new
	 * screen for the player and call your refresh method.
	 * @param event
	 */
	exports.ScreenArranger.prototype.onPlayerJoined = function (event) {
		event.player.screen = new exports.Screen(event.player);
		this.refresh();
	};

	/**
	 * This method is callen whenever a new player leaves the session.
	 * Feel free to override. In this case you may want to call your 
	 * refresh method.
	 * @param event
	 */
	exports.ScreenArranger.prototype.onPlayerLeft = function (event) {
		this.refresh();
	};

	/**
	 * Fired when the screen layout changes. This may be because a player
	 * joined or left the session.
	 * @event module:plugins/screens.ScreenArranger#arrangementChanged
	 */

	return exports;

});