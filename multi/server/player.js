/**
 * @module Player
 * @private
 */

var util = require('util');
var EventDispatcher = require('../shared/eventDispatcher');

/**
 * @class
 */
var Player = function (socket) {
	var player = this;
	this.socket = socket;
	this.id = socket.id;

	EventDispatcher.call(this);

	this.socket.on('disconnect', function(event) {
		// player.onDisconnect(event);
	});
};

/* class methods */
util.inherits(Player, EventDispatcher);

/* event handler */

/* exports */
exports.create = function(socket) {
	return new Player(socket);
};