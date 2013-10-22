/**
 * @module client/player
 * @private
 */
 
define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var util = require('util');

	/**
	* @inner
	* @class
	* @mixes EventDispatcher
	* @memberof module:client/player
	*/
	var Player = function () {

		EventDispatcher.call(this);
		this.id = null;

	};

	util.inherits(Player, EventDispatcher);

	/**
	* Unpacks a player object send over a socket connection.
	* @returns {module:client/player~Player}
	*/
	exports.fromPackedData = function (data) {
		var player = new Player();
		for (var i in data) {
			player[i] = data[i];
		}
		return player;
	};

	return exports;

});