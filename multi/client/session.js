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

		this.players = {};
		this.myself = myself;
		this.socket = socket;

		socket.on('playerJoined', function (data) {
			var player = playerModule.fromPackedData(data);
			session.players[player.id] = player;
			session.dispatchEvent('playerJoined', { player: player });
		});

		socket.on('playerLeft', function (data) {
			var player = session.players[data.playerId];
			delete session.players[data.playerId];
			session.dispatchEvent('playerLeft', { player: player });
			player.dispatchEvent('disconnected');
		});

		socket.on('disconnect', function (data) {
			session.dispatchEvent('destroyed');
			session.socket = null;
		});

		socket.on('playerAttributesChanged', function (data) {
			var player = session.players[data.id];
			if (player === undefined) {
				player = session.myself;
			}
			player.attributes = data.attributes;
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
				var players = {};
				for (var j in data.session.players) {
					var player = playerModule.fromPackedData(data.session.players[j]);
					players[player.id] = player;
				}
				session.players = players;
			} else {
				session[i] = data.session[i];
			}
		}
		return session;
	};

	return exports;

});