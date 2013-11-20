/* global exports */

/**
* Entry point for the server side multi library for developing
* multiscreen games.
* Call {@link module:server/multi.init|init()} to initialize this library.
* @module server/multi
*/


var EventDispatcher = require('../shared/eventDispatcher');
var sessionModule = require('./session');
var playerModule = require('./player');
var color = require('../shared/color');
var util = require('util');

var instance = null;

/**
* @inner
* @class
* @protected
* @mixes EventDispatcher
* @fires module:server/multi~Multi#sessionCreated
*/
var Multi = function (app, server) {

	EventDispatcher.call(this);

	var multi = this;
	var io = require('socket.io').listen(server);

	// when a new player connection is coming in...
	io.on('connection', function (socket) {

		// create new player and wait
		var player = playerModule.create(socket);

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
				} else {
					player.role = 'player';
					socket.emit('sessionJoined', { session: session.pack(), player: player.pack() });
					session.addPlayer(player);
				}
			}
		});
		// create new session
		socket.on('createSession', function(event) {
			var session = sessionModule.create(io, event.options);
			if (session === null) {
				socket.emit('createSessionFailed', {
					token: event.token,
					reason: 'tokenAlreadyExists'
				});
			} else {
				multi.dispatchEvent('sessionCreated', { session: session });
				player.role = 'presenter';
				socket.emit('sessionCreated', { session: session.pack(), player: player.pack() });
				session.addPlayer(player);
			}
		});
	
	});

};

util.inherits(Multi, EventDispatcher);

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
exports.init = function (app, server) {
	if (instance === null) {
		instance = new Multi(app, server);
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
