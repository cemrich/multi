/**
 * @module client/player
 * @private
 */
 
define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var WatchJS = require('../debs/watch');
	var util = require('util');

	/**
	* @inner
	* @class
	* @mixes EventDispatcher
	* @memberof module:client/player
	*/
	var Player = function () {
		var player = this;

		EventDispatcher.call(this);
		this.id = null;
		this.role = 'player';
		this.attributes = { color: null };

		/** 
		 * Called when the user attributes have been changed.
		 * @param {string} prop      property that has been changed
		 * @param {string} action    what has been done to the property
		 * @param          newvalue  new value of the changed property
		 * @param          oldvalue  old value of the changed property
		 */
		function onAttributesChange(prop, action, newvalue, oldvalue) {
			// console.log(prop+" - action: "+action+" - new: "+newvalue+", old: "+oldvalue);
			player.dispatchEvent('attributesChangedLocally');
		}

		WatchJS.watch(this.attributes, onAttributesChange, 0, true);
	};

	util.inherits(Player, EventDispatcher);

	Player.prototype.updateAttributesFromServer = function (val) {
		WatchJS.noMore = true;
		for (var i in val) {
			this.attributes[i] = val[i];
		}
		this.dispatchEvent('attributesChanged');
		WatchJS.noMore = false;
	};

	Player.prototype.dispatchMessageFromServer = function(type, data) {
		this.dispatchEvent(type, { type: type, data: data } );
	};

	/**
	* Sends the given message to all other instances of this player.
	* @param {string} type    type of message that should be send
	* @param {object} [data]  message data that should be send
	*/
	Player.prototype.message = function (type, data) {
		this.dispatchEvent('messageSendLocally', { type: type, data: data } );
	};

	/**
	* Unpacks a player object send over a socket connection.
	* @returns {module:client/player~Player}
	*/
	exports.fromPackedData = function (data) {
		var player = new Player();
		for (var i in data) {
			if (i === 'attributes') {
				for (var j in data[i]) {
					player.attributes[j] = data[i][j];
				}
			} else {
				player[i] = data[i];
			}
		}
		return player;
	};

	return exports;

});