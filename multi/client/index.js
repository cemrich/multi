/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
*/

define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');

	var Player = function () {};
	Player.prototype = new EventDispatcher();


	/**
	 * @public
	 */
	exports.createSession = function () {
		// return session
	};
	
	/**
	 * @public
	 */
	exports.connectToSession = function (sessionId) {
		// return session
	};

});
