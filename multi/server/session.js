/**
 * @module server/session
 */

var util = require('util');
var token = require('./token');
var EventDispatcher = require('../shared/eventDispatcher');

/**
 * @typedef {Object} SessionOptions
 * @property {string} token.func  name of a function inside the {@link module:server/token} module that should generate the session token
 * @property {Array}  token.args   argument array for the token generation function
 */

/**
 * A game session that connects multiple players.
 * @mixes EventDispatcher
 * @class
 * @protected
 * @param {socket.io} io  ready to use and listening socket.io instance
 * @param {SessionOptions} options to tweak this sessions behaviour

 */
var Session = function (io, options) {
	var session = this;

	var tokenFunction = token.numeric;
	var tokenFunctionArgs = [];

	if (options !== undefined) {
		if (options.token !== undefined) {
			tokenFunction = token[options.token.func] || tokenFunction;
			tokenFunctionArgs = options.token.args || tokenFunctionArgs;
		}
	}

	/** 
	 * unique token identifying this session
	 * @type {string}
	 * @readonly
	 */
	this.token = tokenFunction.apply(this, tokenFunctionArgs);

	/**
	 * Dictionary of all players currently connected
	 * to this session mapped on their ids.
	 * @type {object}
	 * @readonly
	 */
	this.players = {};

	/**
	 * Ready to use and listening socket.io instance
	 * @type {socket.io}
	 */
	this.io = io;

	EventDispatcher.call(this);

	/**
	 * Called when the user attributes of any player in this session 
	 * had been changed. Relays this event to all players in this
	 * session.
	 */
	this.onPlayerAttributesChanged = function (event) {
		var player = event.currentTarget;
		session.sendToPlayers('playerAttributesChanged', 
			{ id: player.id, attributes: player.attributes }
		);
	};
};

util.inherits(Session, EventDispatcher);


/**
 * Relays a given event to all players currently connected
 * to this session. 
 * @param {string} eventName       name of the event
 * @param {object} [eventData={}]  optional event data
 */
Session.prototype.sendToPlayers = function (eventName, eventData) {
	this.io.sockets.in(this.token).emit(eventName, eventData);
};

/**
 * Prepares this session and all its players for sending 
 * it via socket message while avoiding circular dependencies.
 * @return {object} packed session object including players
 */
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
	this.sendToPlayers('playerJoined', player.pack());
	player.socket.join(this.token);
	this.players[player.id] = player;
	player.on('disconnected', function(event) {
		session.removePlayer(player);
	});
	player.on('attributesChanged', this.onPlayerAttributesChanged);
	this.dispatchEvent('playerAdded', { player: player });
};

/**
 * Removes the given player from this session.
 * @param player {module:server/player~Player} player instance to remove
 * @fires module:server/session~Session#playerRemoved
 */
Session.prototype.removePlayer = function (player) {
	player.off('attributesChanged', this.onPlayerAttributesChanged);
	delete this.players[player.id];
	this.dispatchEvent('playerLeft', { player: player });
	this.sendToPlayers('playerLeft', { playerId: player.id });
	if (Object.keys(this.players).length === 0) {
		this.dispatchEvent('destroyed');
	}
};


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
 * @param {socket.io}      io       ready to use and listening socket.io instance
 * @param {SessionOptions} options  to tweak the new sessions behaviour
 * @returns {module:server/session~Session} newly created session
 */
exports.create = function(io, options) {
	var session = new Session(io, options);
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
 
/**
 * Fired when this session is no longer valid. Don't use this
 * session any longer after the event has been fired.
 * @event module:server/session~Session#destroyed
 */
