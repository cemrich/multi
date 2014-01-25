/* jshint globalstrict: true */
/* global exports */
'use strict';

/**
 * @module server/session
 * @private
 */

var AbstractSession = require('../shared/session').Session;
var MessageBus = require('./messages').MessageBus;
var MessageSender = require('../shared/CustomMessageSender');
var errors = require('../shared/errors');
var util = require('util');
var token = require('./token');

var SCRIPT_DIR = '../../games';
var SCRIPT_NAME_REGEXP = /^(\d|[A-Za-z])+$/;
// how often to create a new token if it already exits
var TOKEN_RETRY_NUMBER = 5;

/**
 * @classdesc A game session that connects and manages multiple players on 
 * the server side.
 * @mixes module:shared/session~Session
 * @class
 * @protected
 * @param {socket.io} io  ready to use and listening socket.io instance
 * @param {SessionOptions} options to tweak this sessions behaviour
 */
var Session = function (io, options) {

	AbstractSession.call(this);

	this.freeNumbers = [];

	this.applyOptions(options);

	this.messageBus = new MessageBus(io, this.token, this.messageFilters);
	this.messageSender = new MessageSender(this.messageBus, 'session');

	this.onSessionReady();
	this.executeServerScript();
};

util.inherits(Session, AbstractSession);

/**
 * Validate path for the server side game script to circumvent unwanted
 * code execution and execute it. On error this session will be destroyed.
 * @private
 */
Session.prototype.executeServerScript = function () {
	if (this.scriptName !== null) {
		if (SCRIPT_NAME_REGEXP.test(this.scriptName)) {
			var path = SCRIPT_DIR + '/' + this.scriptName;
			new require(path)(this);
		} else {
			throw new errors.ScriptNameNotAllowedError();
		}
	}
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
 * @see module:shared/player~Player#addPlayer
 * @private
 */
Session.prototype.addPlayer = function (player, socket) {
	this.messageBus.send({
		name: 'playerJoined',
		fromInstance: 'session',
		playerData: player.serialize()
	});

	this.messageBus.addSocket(socket);
	AbstractSession.prototype.addPlayer.call(this, player);
};

Session.prototype.removePlayer = function (player) {
	this.freeNumbers.push(player.number);

	AbstractSession.prototype.removePlayer.call(this, player);

	if (this.getPlayerCount() === 0) {
		this.destroy();
	}
};


/* private */

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

	var tries = 0;
	do {
		this.token = tokenFunction.apply(this, tokenFunctionArgs);
		tries++;
	} while (exports.getSession(this.token) && tries <= TOKEN_RETRY_NUMBER);
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
		throw new errors.TokenAlreadyExistsError();
	}

	sessions[session.token] = session;
	session.on('destroyed', function() {
		delete sessions[session.token];
	});
	return session;
};