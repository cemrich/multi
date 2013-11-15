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
	var Player = function (socket) {
		var player = this;

		EventDispatcher.call(this);
		this.socket = socket;
		this.id = null;
		this.role = 'player';
		this.attributes = {};
		this.number = null;

		function onPlayerMessage(data) {
			if (data.id === player.id) {
				player.dispatchEvent(data.type, { type: data.type, data: data.data } );
			}
		}

		function onPlayerAttributesChanged(data) {
			if (data.id === player.id) {
				WatchJS.noMore = true;
				for (var i in data.attributes) {
					player.attributes[i] = data.attributes[i];
				}
				player.dispatchEvent('attributesChanged');
				WatchJS.noMore = false;
			}
		}

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
			player.socket.emit('playerAttributesChanged',
				{ id: player.id, attributes: player.attributes }
			);
		}

		this.socket.on('playerMessage', onPlayerMessage);
		this.socket.on('playerAttributesChanged', onPlayerAttributesChanged);
		WatchJS.watch(this.attributes, onAttributesChange, 0, true);
	};

	util.inherits(Player, EventDispatcher);

	/**
	* Sends the given message to all other instances of this player.
	* @param {string} type    type of message that should be send
	* @param {object} [data]  message data that should be send
	*/
	Player.prototype.message = function (type, data) {
		this.socket.emit('playerMessage',
			{ id: this.id, type: type, data: data }
		);
	};

	/**
	* Unpacks a player object send over a socket connection.
	* @returns {module:client/player~Player}
	*/
	exports.fromPackedData = function (data, socket) {
		var player = new Player(socket);
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