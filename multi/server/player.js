/**
 * @module server/player
 */

var util = require('util');
var EventDispatcher = require('../shared/eventDispatcher');

/**
 * @mixes EventDispatcher
 * @class
 * @protected
 * @param {socket.io-socket} socket  communication socket for the new player
 */
var Player = function (socket) {

	var player = this;

	/** 
	 * communication socket for this player
	 * @type {socket.io-socket}
	 * @private
	 */
	this.socket = socket;
	/** 
	 * unique id for this player
	 * @type {number}
	 * @readonly
	 */
	this.id = socket.id;

	EventDispatcher.call(this);

	this.socket.on('disconnect', function(event) {
		// player.onDisconnect(event);
	});
};

/* class methods */
util.inherits(Player, EventDispatcher);

Player.prototype.pack = function () {
	return { 
		id: this.id 
	};
};

/* event handler */

/* exports */
/**
 * Creates a new player.
 * @param {socket.io-socket} socket        communication socket for the new player
 * @returns {module:server/player~Player}  newly created player
 */
exports.create = function(socket) {
	return new Player(socket);
};