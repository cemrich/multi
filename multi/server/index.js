/**
* Entry point for the server side multi library for developing
* multiscreen games.
* Call {@link module:multi.start|start()} to initialize this library.
* @module server/multi
*/


var EventDispatcher = require('../shared/eventDispatcher');
var sessionModule = require('./session');
var playerModule = require('./player');

/**
 * Call this once to initialize the multi framework.
 * @public
 */
function start(app, server, options) {

	var io = require('socket.io').listen(server);
	console.log('starting multi');

	// adding route for first game
	app.get(options.gameUrlSuffix + 'example1', function(req, res) {
		res.render(options.gameViewSubdir + 'example1');
	});

	// when a new player connection is coming in...
	io.on('connection', function (socket) {
		// create new player and wait
		var player = playerModule.create(socket);

		// use existing session
		socket.on('joinSession', function(event) {
			var session = sessionModule.getSession(event.token);
			session.addPlayer(player);
			socket.emit('sessionJoined', { token: session.token });
		});
		// create new session
		socket.on('createSession', function(event) {
			var session = sessionModule.create();
			session.addPlayer(player);
			socket.emit('sessionCreated', { token: session.token });
		});
	});
}

module.exports = {
	start: start
};


