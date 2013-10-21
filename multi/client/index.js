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
		exports.createSession = function () {
			var socket = io.connect(server);
			console.log(socket);
			// return session, player
		};
		
		/**
		 * @public
		 */
		exports.connectToSession = function (sessionId) {
			// return session, player
		};
		
	};

});
