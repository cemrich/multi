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
		this._attributes = {};
	};

	util.inherits(Player, EventDispatcher);

	Object.defineProperty(Player.prototype, "attributes", {
		get: function () { 
			return this._attributes;
		},
		set: function (val) { 
			this._attributes = val;
			this.dispatchEvent('attributesChanged');
		}
	});

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