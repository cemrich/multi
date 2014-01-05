/* global exports */

/**
 * @module server/session
 * @private
 */

var AbstractSession = require('../shared/session').Session;
var MessageBus = require('./messages').MessageBus;
var MessageSender = require('../shared/CustomMessageSender');
var util = require('util');
var token = require('./token');


/**
 * @classdesc A game session that connects and manages multiple players.
 * @mixes external:EventEmitter
 * @class
 * @protected
 * @param {socket.io} io  ready to use and listening socket.io instance
 * @param {SessionOptions} options to tweak this sessions behaviour
 */
var Session = function (io, options) {

	AbstractSession.call(this);

	/**
	 * if false no more clients are allowed to join this session
	 * @private
	 */
	this.enablePlayerJoining = true;
	this.freeNumbers = [];

	this.applyOptions(options);

	this.messageBus = new MessageBus(io, this.token, this.messageFilters);
	this.messageSender = new MessageSender(this.messageBus, 'session');

	this.onSessionReady();
	this.messageBus.register('changePlayerJoining', 'session', this.onChangePlayerJoining.bind(this));

	if (this.scriptName !== null) {
		var gameModule = require('../../' + options.scriptName);
		gameModule.Game(this);
	}
};

util.inherits(Session, AbstractSession);

/**
 * Validates the given session options and adds them to this session.
 * @private
 */
Session.prototype.applyOptions = function (options) {
	options = options || {};

	var tokenFunction = token.numeric;
	var tokenFunctionArgs = [];
	this.messageFilters = options.filter;
	this.scriptName = options.scriptName || null;

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

	this.token = tokenFunction.apply(this, tokenFunctionArgs);
};

/**
 * Some client decided that the player policy should change
 * for this session.
 * @private
 */
Session.prototype.onChangePlayerJoining = function (message) {
	this.enablePlayerJoining = message.enablePlayerJoining;
};

Session.prototype.disablePlayerJoining = function () {
	this.enablePlayerJoining = false;
};

Session.prototype.enablePlayerJoining = function () {
	this.enablePlayerJoining = true;
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
 * @param {socket.io-socket} socket commuication socket of the given player
 * @fires module:shared/session~Session#playerJoined
 */
Session.prototype.addPlayer = function (player, socket) {
	var session = this;

	// inform clients expect added player about this player
	this.messageBus.send({
		name: 'playerJoined',
		fromInstance: 'session',
		playerData: player.serialize()
	});

	// add to collections
	this.messageBus.addSocket(socket);
	this.players[player.id] = player;

	// add listeners
	player.on('disconnected', function(event) {
		session.removePlayer(player);
	});

	// inform others about this player
	this.emit('playerJoined', { player: player });
	if (this.getPlayerCount() === this.minPlayerNeeded) {
		this.emit('aboveMinPlayerNeeded');
	}
};

/**
 * Removes the given player from this session.
 * @param player {module:server/player~Player} player instance to remove
 * @fires module:shared/session~Session#playerRemoved
 * @private
 */
Session.prototype.removePlayer = function (player) {
	this.freeNumbers.push(player.number);
	delete this.players[player.id];
	this.emit('playerLeft', { player: player });
	this.messageBus.send({
		name: 'playerLeft',
		fromInstance: 'session',
		playerId: player.id
	});
	if (this.getPlayerCount() === (this.minPlayerNeeded-1)) {
		this.emit('belowMinPlayerNeeded');
	}
	if (this.getPlayerCount() === 0) {
		this.emit('destroyed');
		this.messageBus.unregisterAll();
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
	});
	return session;
};