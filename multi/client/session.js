/**
 * @module client/session
 * @private
 */

define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var playerModule = require('./player');
	var util = require('util');

	/**
	* @inner
	* @class
	* @mixes EventDispatcher
	* @memberof module:client/session
	*/
	var Session = function () {

		EventDispatcher.call(this);
		this.players = [];
		this.myself = null;

	};

	util.inherits(Session, EventDispatcher);

	/**
	* Unpacks a session object send over a socket connection.
	* @returns {module:client/session~Session}
	*/
	exports.fromPackedData = function (data, myself) {
		var session = new Session();
		for (var i in data) {
			if (i === 'players') {
				var players = [];
				for (var j in data.players) {
					players[j] = playerModule.fromPackedData(data.players[j]);
					session.players = players;
				}
			} else {
				session[i] = data[i];
			}
		}
		session.myself = myself;
		return session;
	};

	return exports;

});