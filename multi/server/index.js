/**
* Entry point for the server side multi library for developing
* multiscreen games.
* Call {@link module:server/multi.init|init()} to initialize this library.
* @module server/multi
*/


var EventDispatcher = require('../shared/eventDispatcher');
var sessionModule = require('./session');
var playerModule = require('./player');
var util = require('util');

var instance = null;

/**
* @inner
* @class
* @mixes EventDispatcher
* @fires module:server/multi~Multi#sessionCreated
*/
var Multi = function (app, server, options) {

	EventDispatcher.call(this);
	this.options = options;

	var multi = this;
	var io = require('socket.io').listen(server);
	console.log('starting multi');

	// adding route for first game
	app.get(options.gameUrlSuffix + 'example1', function(req, res) {
		res.render(options.gameViewSubdir + 'example1');
	});
	app.get(options.gameUrlSuffix + 'symbols', function(req, res) {
		res.render(options.gameViewSubdir + 'symbols');
	});

	// when a new player connection is coming in...
	io.on('connection', function (socket) {

		// create new player and wait
		var player = playerModule.create(socket);

		// use existing session
		socket.on('joinSession', function(event) {
			var session = sessionModule.getSession(event.token);
			if (session === null) {
				socket.emit('joinSessionFailed', { token: event.token });
			} else {
				socket.emit('sessionJoined', { session: session.pack(), player: player.pack() });
				session.addPlayer(player);
			}
		});
		// create new session
		socket.on('createSession', function(event) {
			var session = sessionModule.create(io);
			multi.dispatchEvent('sessionCreated', { session: session });
			socket.emit('sessionCreated', { session: session.pack(), player: player.pack() });
			session.addPlayer(player);
		});
	
	});

};

util.inherits(Multi, EventDispatcher);

/**
 * @event module:server/multi~Multi#sessionCreated
 */

/**
 * Call this once to initialize the multi framework.
 * @public
 * @returns {module:server/multi~Multi} the one and only Multi instance
 */
exports.init = function (app, server, options) {
	if (instance === null) {
		instance = new Multi(app, server, options);
		return instance;
	} else {
		throw 'only one call to init allowed';
	}
};

