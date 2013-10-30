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

	Player.prototype.updateAttributesFromServer = function (val) {
		console.log('updateAttributesFromServer');
		this._attributes = val;
		this.dispatchEvent('attributesChanged');
	};

	Object.defineProperty(Player.prototype, "attributes", {
		get: function () { 
			return this._attributes;
		},
		set: function (val) {
			console.log('set attributes');
			this._attributes = val;
			this.dispatchEvent('attributesChangedLocally');
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