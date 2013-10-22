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
	var Session = function (myself, socket) {

		EventDispatcher.call(this);
		var session = this;
		this.players = [];
		this.myself = myself;
		this.socket = socket;

		socket.on('playerJoined', function (data) {
			var player = playerModule.fromPackedData(data);
			session.dispatchEvent('playerJoined', { player: player });
		});
	};

	util.inherits(Session, EventDispatcher);

	/**
	* Unpacks a session object send over a socket connection.
	* @returns {module:client/session~Session}
	*/
	exports.fromPackedData = function (data, socket) {
		var myself = playerModule.fromPackedData(data.player);
		var session = new Session(myself, socket);
		for (var i in data.session) {
			if (i === 'players') {
				var players = [];
				for (var j in data.session.players) {
					players[j] = playerModule.fromPackedData(data.session.players[j]);
					session.players = players;
				}
			} else {
				session[i] = data.session[i];
			}
		}
		return session;
	};

	return exports;

});