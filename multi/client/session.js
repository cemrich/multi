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
		/** 
		 * unique token identifying this session
		 * @type {string}
		 * @readonly
		 */
		this.token = null;

		function onMessageSendLocally(event) {
			var player = event.currentTarget;
			socket.emit('playerMessage', 
				{ id: player.id, type: event.type, data: event.data }
			);
		}

		function onAttributesChangedLocally(event) {
			var player = event.currentTarget;
			socket.emit('playerAttributesChanged', 
				{ id: player.id, attributes: player.attributes }
			);
		}

		function getPlayer(id) {
			var player = session.players[id];
			if (player === undefined && id === session.myself.id) {
				player = session.myself;
			}
			if (player === undefined) {
				console.error('player not found', id);
			}
			return player;
		}

		myself.on('attributesChangedLocally', onAttributesChangedLocally);
		myself.on('messageSendLocally', onMessageSendLocally);

		socket.on('playerJoined', function (data) {
			var player = playerModule.fromPackedData(data);
			session.players[player.id] = player;
			session.dispatchEvent('playerJoined', { player: player });
			player.on('attributesChangedLocally', onAttributesChangedLocally);
			player.on('messageSendLocally', onMessageSendLocally);
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
			var player = getPlayer(data.id);
			if (player !== undefined) {
				player.updateAttributesFromServer(data.attributes);
			}
		});

		socket.on('sessionMessage', function (data) {
			session.dispatchEvent(data.type, data);
		});
		socket.on('playerMessage', function (data) {
			var player = getPlayer(data.id);
			if (player !== undefined) {
				player.dispatchMessageFromServer(data.type, data.data);
			}
		});
	};

	util.inherits(Session, EventDispatcher);

	/**
	* Sends the given message to all other instances of this session.
	* @param {string} type    type of message that should be send
	* @param {object} [data]  message data that should be send
	*/
	Session.prototype.message = function (type, data) {
		this.socket.emit('sessionMessage', { type: type, data: data }); 
	};

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