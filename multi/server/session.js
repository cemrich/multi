/* global exports */

/**
 * @module server/session
 */

var util = require('util');
var token = require('./token');
var EventDispatcher = require('../shared/eventDispatcher');

/**
 * @typedef {Object} SessionOptions
 * @property {string} [scriptName] name of server side script file that should
 *  be executed when a new session is created. This module must provide a Game
 *  constructor that takes a session as only argument.
 * @property {string} [token.func='numeric']  name of a function inside the {@link module:server/token} module that should generate the session token
 * @property {Array}  [token.args=[]]   argument array for the token generation function
 * @property {integer}[minPlayerNeeded=1] minimum number of players needed for this session
 * @property {integer}[maxPlayerAllowed=10] maximum number of players allowed for this session. Every addition player won't be allowed to join the session.
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
	this.minPlayerNeeded = 1;
	this.maxPlayerAllowed = 10;

	if (options !== undefined) {
		if (options.token !== undefined) {
			tokenFunction = token[options.token.func] || tokenFunction;
			tokenFunctionArgs = options.token.args || tokenFunctionArgs;
		}
		if (options.minPlayerNeeded !== undefined && options.minPlayerNeeded > 0) {
			this.minPlayerNeeded = options.minPlayerNeeded;
		}
		if (options.maxPlayerAllowed !== undefined && options.maxPlayerAllowed >= this.minPlayerNeeded) {
			this.maxPlayerAllowed = options.maxPlayerAllowed;
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

	this.freeNumbers = [];

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

	if (options !== undefined && options.scriptName !== undefined) {
		var gameModule = require('../../' + options.scriptName);
		gameModule.Game(this);
	}
};

util.inherits(Session, EventDispatcher);

Session.prototype.onSessionMessage = function (event) {
	this.sendToPlayers('sessionMessage', { type: event.type, data: event.data });
	this.dispatchEvent(event.type, { type: event.type, data: event.data });
};

Session.prototype.onPlayerMessage = function (event) {
	this.sendToPlayers('playerMessage', { id: event.id, type: event.type, data: event.data });
};

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
		players: players,
		minPlayerNeeded: this.minPlayerNeeded,
		maxPlayerAllowed: this.maxPlayerAllowed
	};
};

/**
 * @return {integer} number of currently connected players
 */
Session.prototype.getPlayerCount = function () {
	return Object.keys(this.players).length;
};

Session.prototype.isFull = function () {
	return this.getPlayerCount() >= this.maxPlayerAllowed;
};

/**
 * Adds the given player to this session.
 * @param player {module:server/player~Player} player instance to add
 * @fires module:server/session~Session#playerAdded
 */
Session.prototype.addPlayer = function (player) {
	var session = this;
	if (this.freeNumbers.length === 0) {
		player.number = this.getPlayerCount();
	} else {
		player.number = this.freeNumbers.sort()[0];
		this.freeNumbers.splice(0,1);
	}
	this.sendToPlayers('playerJoined', player.pack());
	player.socket.join(this.token);
	this.players[player.id] = player;
	player.on('disconnected', function(event) {
		session.removePlayer(player);
	});
	player.on('attributesChanged', this.onPlayerAttributesChanged);
	player.on('sessionMessage', this.onSessionMessage.bind(this));
	player.on('playerMessage', this.onPlayerMessage.bind(this));
	this.dispatchEvent('playerAdded', { player: player });
	if (this.getPlayerCount() === this.minPlayerNeeded) {
		this.dispatchEvent('aboveMinPlayerNeeded');
	}
};

/**
 * Removes the given player from this session.
 * @param player {module:server/player~Player} player instance to remove
 * @fires module:server/session~Session#playerRemoved
 */
Session.prototype.removePlayer = function (player) {
	player.off('attributesChanged', this.onPlayerAttributesChanged);
	this.freeNumbers.push(player.number);
	delete this.players[player.id];
	this.dispatchEvent('playerLeft', { player: player });
	this.sendToPlayers('playerLeft', { playerId: player.id });
	if (this.getPlayerCount() === (this.minPlayerNeeded-1)) {
		this.dispatchEvent('belowMinPlayerNeeded');
	}
	if (this.getPlayerCount() === 0) {
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

	if (exports.getSession(session.token) !== null) {
		return null;
	}

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
