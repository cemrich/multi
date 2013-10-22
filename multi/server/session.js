/**
 * @module Session
 * @private
 */

var util = require('util');
var EventDispatcher = require('../shared/eventDispatcher');

/**
 * @see module:Multi#event:newSession
 * @mixes module:Events.EventDispatcher
 * @class
 * @protected
 */
var Session = function () {
	/** 
	 * unique session token (3 digits) 
	 * @type {number}
	 * @readonly
	 */
	this.token = Math.floor(Math.random() * 900) + 100;
	/**
	 * @readonly
	 */
	this.players = [];

	EventDispatcher.call(this);
};

util.inherits(Session, EventDispatcher);

/**
 * Adds the given player to this session. You will not need 
 * this because the framework handles all the player management.
 * @param player {module:Player~Player} player instance to add
 * @fires module:Session~Session#playerAdded
 */
Session.prototype.addPlayer = function (player) {
	var session = this;
	this.players.push(player);
	player.on('disconnect', function(event) {
		session.removePlayer(player);
	});
	this.dispatchEvent('playerAdded', { player: player });
};

/**
 * Removes the given player from this session. The framework will
 * remove all disconnected players by default.
 * @param player {module:Player~Player} player instance to remove
 * @fires module:Session~Session#playerRemoved
 */
Session.prototype.removePlayer = function (player) {
	delete this.players[player.id];
	player.leaveSession();
	this.sendPlayerListChange();
	this.dispatchEvent('playerRemoved', { player: player });
};

/* event handler */


/* module functions */
var sessions = [];

/**
 * Looks up the session with the given token.
 * @param token {number}              token of the session that should be returned
 * @returns {module:Session~Session}  session with the given token or null
 */
exports.getSession = function (token) {
	for (var i in sessions) {
		if (sessions[i].token == token) {
			return sessions[i];
		}
	}
	return null;
};

/**
 * Creates a new session.
 * @returns {module:Session~Session} newly created session
 */
exports.create = function() {
	var session = new Session();
	sessions.push(session);
	return session;
};

/**
 * Fired when a new player has been added to this session.
 * From now on you can safely communicate with this player.
 * @event module:Session~Session#playerAdded
 * @property {module:Player~Player} player  The newly added player.
 */

/**
 * Fired when a new player has been removed from this session.
 * @event module:Session~Session#playerRemoved
 * @property {module:Player~Player} player  The removed player.
 */
