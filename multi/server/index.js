/* jshint globalstrict: true */
/* global exports */
'use strict';

/**
* Entry point for the server side multi library for developing
* multiscreen games.
* Call {@link module:server/multi.init|init()} to initialize this library.
* @module server/multi
*/

/**
 * The Node.js EventEmitter you can find under 
 * require('events').EventEmitter
 * @external EventEmitter
 * @see {@link http://nodejs.org/docs/latest/api/events.html}
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var sessionModule = require('./session');
var playerModule = require('./player');
var color = require('../shared/color');
var errors = require('../shared/errors');
var screensModule = require('../plugins/screens');
var HorizontalArranger = require('../plugins/screens/HorizontalArranger');

var instance = null;

/**
 * @typedef {(string|Array.<string>|module:server/player~Player)} module:server/multi~toClient
 * @description  Option to determine to which client a message should be send
 * (not to which _instance_ on this client).<br>
 * You can set it to:
 * <ul>
 * <li>'all' - the message will be send to all clients currently connected to
 * this session</li>
 * <li>[player1, player2] - message will be send to all clients that are
 * represented by players inside this array</li>
 * <li>myPlayer - the message will be send to the client that is represented
 * by myPlayer</li>
 * </ul>
 */

/**
* @inner
* @class
* @protected
* @mixes external:EventEmitter
* @fires module:server/multi~Multi#sessionCreated
*/
var Multi = function (server) {

	EventEmitter.call(this);

	var multi = this;
	var io = require('socket.io').listen(server);

	// when a new player connection is coming in...
	io.on('connection', function (socket) {

		// use existing session
		socket.on('joinSession', function(event) {
			var session = sessionModule.getSession(event.token);
			if (session === null) {
				socket.emit('joinSessionFailed', {
						token: event.token,
						reason: 'sessionNotFound'
					});
			} else {
				if (session.isFull()) {
					socket.emit('joinSessionFailed', {
						token: event.token,
						reason: 'sessionFull'
					});
				} else if (!session.playerJoiningEnabled) {
					socket.emit('joinSessionFailed', {
						token: event.token,
						reason: 'joiningDisabled'
					});
				} else {
					var player = playerModule.create(socket.id, session.messageBus, event.playerParams);
					player.number = session.getNextFreePlayerNumber();
					socket.emit('sessionJoined', { session: session.serialize(), player: player.serialize() });
					session.addPlayer(player, socket);
				}
			}
		});
		// create new session
		socket.on('createSession', function(event) {
			var session = null;

			try {
				session = sessionModule.create(io, event.options);
			} catch (error) {
				var reason = error.message;
				if (error instanceof errors.TokenAlreadyExistsError) {
					reason = 'tokenAlreadyExists';
				} else if (error instanceof errors.ScriptNameNotAllowedError) {
					reason = 'scriptNameNotAllowed';
				}
				socket.emit('createSessionFailed', {
					token: event.token,
					reason: reason
				});
			}

			if (session !== null) {
				multi.emit('sessionCreated', { session: session });
				var player = playerModule.create(socket.id, session.messageBus, event.playerParams);
				player.number = session.getNextFreePlayerNumber();
				socket.emit('sessionCreated', { session: session.serialize(), player: player.serialize() });
				session.addPlayer(player, socket);
			}
		});
	
	});

};

util.inherits(Multi, EventEmitter);

/**
 * Fired, when a client requested to create a new session
 * and the session has been created successfully.
 * @param session {module:server/session~Session} the newly created session
 * @event module:server/multi~Multi#sessionCreated
 */


/* module functions */

/**
 * Call this once to initialize the multi framework.
 * @public
 * @returns {module:server/multi~Multi} the one and only Multi instance
 */
exports.init = function (server) {
	if (instance === null) {
		instance = new Multi(server);
		return instance;
	} else {
		throw 'only one call to init allowed';
	}
};

/**
 * Loaded {@link module:shared/color|color module}
 * for color helper functions.
 * @public
 * @type module:shared/color
 */
exports.color = color;

/**
 * @type module:plugins/screens
 */
exports.screens = screensModule;
exports.screens.HorizontalArranger = HorizontalArranger;