/**
 * @module server/session
 */

var util = require('util');
var EventDispatcher = require('../shared/eventDispatcher');

/**
 * @mixes EventDispatcher
 * @class
 * @protected
 */
var Session = function (io) {
	/** 
	 * unique session token (3 digits) 
	 * @type {number}
	 * @readonly
	 */
	this.token = Math.floor(Math.random() * 900) + 100;
	/**
	 * @readonly
	 */
	this.players = {};
	this.io = io;

	EventDispatcher.call(this);
};

util.inherits(Session, EventDispatcher);

Session.prototype.pack = function() {
	var players = [];
	for (var i in this.players) {
		players.push(this.players[i].pack());
	}
	return {
		token: this.token,
		players: players
	};
};

/**
 * Adds the given player to this session.
 * @param player {module:server/player~Player} player instance to add
 * @fires module:server/session~Session#playerAdded
 */
Session.prototype.addPlayer = function (player) {
	var session = this;
	this.io.sockets.in(this.token).emit('playerJoined', player.pack());
	player.socket.join(this.token);
	this.players[player.id] = player;
	player.on('disconnected', function(event) {
		session.removePlayer(player);
	});
	this.dispatchEvent('playerAdded', { player: player });
};

/**
 * Removes the given player from this session.
 * @param player {module:server/player~Player} player instance to remove
 * @fires module:server/session~Session#playerRemoved
 */
Session.prototype.removePlayer = function (player) {
	delete this.players[player.id];
	this.dispatchEvent('playerLeft', { player: player });
	this.io.sockets.in(this.token).emit('playerLeft', { playerId: player.id });
	if (Object.keys(this.players).length === 0) {
		this.dispatchEvent('destroyed');
	}
};

/* event handler */


/* module functions */
var sessions = {};

/**
 * Looks up the session with the given token.
 * @param token {number}              token of the session that should be returned
 * @returns {module:server/session~Session}  session with the given token or null
 */
exports.getSession = function (token) {
	return sessions[token] || null;
};

/**
 * Creates a new session.
 * @returns {module:server/session~Session} newly created session
 */
exports.create = function(io) {
	var session = new Session(io);
	sessions[session.token] = session;
	session.on('destroyed', function() {
		delete sessions[session.token];
		console.log('session destroyed:', session.token);
	});
	return session;
};

/**
 * Fired when a new player has been added to this session.
 * From now on you can safely communicate with this player.
 * @event module:server/session~Session#playerAdded
 * @property {module:server/player~Player} player  The newly added player.
 */

/**
 * Fired when a new player has been removed from this session.
 * @event module:server/session~Session#playerRemoved
 * @property {module:server/player~Player} player  The removed player.
 */
