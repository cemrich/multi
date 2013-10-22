/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
*/

define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var Player = require('player');
	var Session = require('session');

	/**
	 * @public
	 */
	exports.init = function (options) {

		var io = options.io;
		var server = options.server;

		/**
		 * @public
		 */
		exports.joinSession = function (sessionToken) {
			console.log('joining session', sessionToken);
			var socket = io.connect(server, {
					'force new connection': true
				});
			socket.on('connect', function () {
				socket.emit('joinSession', { token: sessionToken });
				socket.on('sessionJoined', function (data) {
					console.log('joined session successfully', data);
					// return session, player
				});
			});
		};

		/**
		 * @public
		 */
		exports.createSession = function () {
			console.log('creating new session');
			var socket = io.connect(server, {
					'force new connection': true
				});
			socket.on('connect', function () {
				socket.emit('createSession');
				socket.on('sessionCreated', function (data) {
					console.log('session created successfully', data);
					exports.joinSession(data.token);
					// return session, player
				});
			});
		};

	};

});
