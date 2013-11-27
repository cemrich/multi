/* global exports */

/**
 * @module server/session
 * @private
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var token = require('./token');

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
 * @classdesc A game session that connects and manages multiple players.
 * @mixes external:EventEmitter
 * @class
 * @protected
 * @param {socket.io} io  ready to use and listening socket.io instance
 * @param {SessionOptions} options to tweak this sessions behaviour
 */
var Session = function (io, options) {

	// parse session options
	var tokenFunction = token.numeric;
	var tokenFunctionArgs = [];

	/**
	 * @see SessionOptions
	 * @readonly
	 */
	this.minPlayerNeeded = 1;
	/**
	 * @see SessionOptions
	 * @readonly
	 */
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
	 * @type {Object.<string, module:client/player~Player>}
	 * @readonly
	 */
	this.players = {};

	/**
	 * Ready to use and listening socket.io instance
	 * @type {socket.io}
	 * @private
	 */
	this.io = io;
	/**
	 * if false no more clients are allowed to join this session
	 * @private
	 */
	this.enablePlayerJoining = true;

	this.freeNumbers = [];

	EventEmitter.call(this);

	if (options !== undefined && options.scriptName !== undefined) {
		var gameModule = require('../../' + options.scriptName);
		gameModule.Game(this);
	}
};

util.inherits(Session, EventEmitter);

/**
 * Some client decided that the player policy should change
 * for this session.
 * @private
 */
Session.prototype.onChangePlayerJoining = function (data) {
	this.enablePlayerJoining = data.enablePlayerJoining;
};

/**
 * Some session instance emitted a message. Distribute to _all_ clients. 
 * @private
 */
Session.prototype.onSessionMessage = function (data) {
	this.sendToPlayers('sessionMessage', { type: data.type, data: data.data });
	this.emit(data.type, { type: data.type, data: data.data });
};

/**
 * Some player emitted a message. Distribute to _all_ clients. 
 * @private
 */
Session.prototype.onPlayerMessage = function (data) {
	this.sendToPlayers('playerMessage', { id: data.id, type: data.type, data: data.data });
};

/**
 * Some players attributes were changed on the client side. 
 * Apply the changes to the affected player.
 * @private
 */
Session.prototype.onPlayerAttributesClientChanged = function (data) {
	var player = this.players[data.id];
	if (typeof player !== 'undefined') {
		player.updateAttributes(data.attributes);
	}
};

/**
* Sends the given message to all client instances of this session.
* @param {string} type    type of message that should be send
* @param {object} [data]  message data that should be send
* @example
* // on client no 1
* session.on('ping', function (event) {
*   // outputs 'bar'
*   console.log(event.data.foo);
* });
* // on server, instance of same session
* session.message('ping', { foo: 'bar' });
*/
Session.prototype.message = function (type, data) {
	this.sendToPlayers('sessionMessage', { type: type, data: data });
};

/**
 * Relays a given event to all players currently connected
 * to this session. 
 * @param {string} eventName       name of the event
 * @param {object} [eventData={}]  optional event data
 * @private
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

/**
 * @return {boolean} true if there are as many ore more players 
 * connected to this session as are allowed
 */
Session.prototype.isFull = function () {
	return this.getPlayerCount() >= this.maxPlayerAllowed;
};

/**
 * @return The next unused player number. Gaps from disconnected
 * players will be filled first.
 * @private
 */
Session.prototype.getNextFreePlayerNumber = function () {
	var number;
	if (this.freeNumbers.length === 0) {
		number = this.getPlayerCount();
	} else {
		number = this.freeNumbers.sort()[0];
		this.freeNumbers.splice(0,1);
	}
	return number;
};

/**
 * Adds the given player to this session.
 * @param player {module:server/player~Player} player instance to add
 * @fires module:server/session~Session#playerJoined
 */
Session.prototype.addPlayer = function (player) {
	var session = this;

	// inform clients expect added player about this player
	this.sendToPlayers('playerJoined', player.pack());

	// add to collections
	player.socket.join(this.token);
	this.players[player.id] = player;

	// add listeners
	player.on('disconnected', function(event) {
		session.removePlayer(player);
	});
	player.on('attributesChanged', function () {
		session.sendToPlayers('playerAttributesChanged',
			{ id: player.id, attributes: player.attributes });
	});
	player.socket.on('playerAttributesClientChanged', this.onPlayerAttributesClientChanged.bind(this));
	player.socket.on('sessionMessage', this.onSessionMessage.bind(this));
	player.socket.on('playerMessage', this.onPlayerMessage.bind(this));
	player.socket.on('changePlayerJoining', this.onChangePlayerJoining.bind(this));

	// inform others about this player
	this.emit('playerJoined', { player: player });
	if (this.getPlayerCount() === this.minPlayerNeeded) {
		this.emit('aboveMinPlayerNeeded');
	}
};

/**
 * Removes the given player from this session.
 * @param player {module:server/player~Player} player instance to remove
 * @fires module:server/session~Session#playerRemoved
 * @private
 */
Session.prototype.removePlayer = function (player) {
	this.freeNumbers.push(player.number);
	delete this.players[player.id];
	this.emit('playerLeft', { player: player });
	this.sendToPlayers('playerLeft', { playerId: player.id });
	if (this.getPlayerCount() === (this.minPlayerNeeded-1)) {
		this.emit('belowMinPlayerNeeded');
	}
	if (this.getPlayerCount() === 0) {
		this.emit('destroyed');
		this.removeAllListeners();
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
 * @private
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
 * @event module:server/session~Session#playerJoined
 * @property {module:server/player~Player} player  The newly added player.
 */

/**
 * Fired when a player has been removed from this session.
 * @event module:server/session~Session#playerLeft
 * @property {module:server/player~Player} player  The removed player.
 */
 
/**
 * Fired when this session is no longer valid. Don't use this
 * session any longer after the event has been fired.
 * @event module:server/session~Session#destroyed
 */
 
/**
 * Fired when a player has been removed from this session and
 * there are now less player connected to this session than stated 
 * in minPlayerNeeded.<br><br>
 * You could listen for this event to stop a running game when
 * the player count is getting to low.
 * @event module:server/session~Session#belowMinPlayerNeeded
 */
 
/**
 * Fired when a new player has been added to this session and
 * there are now exactly as many players connected to this session
 * as stated in minPlayerNeeded.<br><br>
 * You could listen for this event to start your game when
 * enough players have connected.
 * @event module:server/session~Session#aboveMinPlayerNeeded
 */
