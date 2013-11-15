/**
 * @module client/session
 * @private
 */

define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var playerModule = require('./player');
	var util = require('util');


	/* 
	* internal module functions
	*/

	function getJoinSesionUrl(token) {
		var url = window.location.host;
		if (window.location.port !== '' && window.location.port !== '80') {
			url += ':' + window.location.port;
		}
		url += window.location.pathname + '#' + token;
		return url;
	}


	/* 
	* session class functions
	*/

	/**
	* @inner
	* @class
	* @mixes EventDispatcher
	* @memberof module:client/session
	*/
	var Session = function (myself, socket, sessionData) {

		EventDispatcher.call(this);
		var session = this;

		this.myself = myself;
		this.socket = socket;
		this.players = {};
		/** 
		 * unique token identifying this session
		 * @type {string}
		 * @readonly
		 */
		this.token = null;
		this.minPlayerNeeded = null;

		var packedPlayers = sessionData.players;
		delete sessionData.players;

		// unpack session attributes
		for (var i in sessionData) {
			this[i] = sessionData[i];
		}
		// unpack players
		for (i in packedPlayers) {
			addPlayer(packedPlayers[i]);
		}

		// calculate attributes
		this.joinSessionUrl = getJoinSesionUrl(this.token);

		function addPlayer(playerData) {
			var player = playerModule.fromPackedData(playerData, socket);
			session.players[player.id] = player;

			session.dispatchEvent('playerJoined', { player: player });
			if (session.getPlayerCount() === session.minPlayerNeeded) {
				session.dispatchEvent('aboveMinPlayerNeeded');
			}
		}

		// TODO: unregister callbacks on disconnect
		socket.on('playerJoined', function (data) {
			addPlayer(data);
		});

		socket.on('playerLeft', function (data) {
			var player = session.players[data.playerId];
			// TODO: clean up _all_ player listeners before deleting
			delete session.players[data.playerId];
			session.dispatchEvent('playerLeft', { player: player });
			player.dispatchEvent('disconnected');

			if (session.getPlayerCount() === (session.minPlayerNeeded-1)) {
				session.dispatchEvent('belowMinPlayerNeeded');
			}
		});

		socket.on('disconnect', function (data) {
			session.dispatchEvent('destroyed');
			session.socket = null;
		});

		socket.on('sessionMessage', function (data) {
			session.dispatchEvent(data.type, data);
		});
	};

	util.inherits(Session, EventDispatcher);

	/**
	 * @return {integer} number of currently connected players including myself
	 */
	Session.prototype.getPlayerCount = function () {
		return Object.keys(this.players).length + 1;
	};

	// TODO: document
	// TODO: this feels wrong as no specific order is guaranteed maps would be great (http://www.nczonline.net/blog/2012/10/09/ecmascript-6-collections-part-2-maps/)
	Session.prototype.getPlayerArray = function () {
		var playerArray = [];
		for(var i in this.players) {
			playerArray.push(this.players[i]);
		}
		return playerArray;
	};

	/**
	* Sends the given message to all other instances of this session.
	* @param {string} type    type of message that should be send
	* @param {object} [data]  message data that should be send
	*/
	Session.prototype.message = function (type, data) {
		this.socket.emit('sessionMessage', { type: type, data: data });
	};

	Session.prototype.disconnectMyself = function () {
		this.socket.socket.disconnect();
	};

	/**
	* Unpacks a session object send over a socket connection.
	* @returns {module:client/session~Session}
	*/
	exports.fromPackedData = function (data, socket) {
		var myself = playerModule.fromPackedData(data.player, socket);
		var session = new Session(myself, socket, data.session);
		return session;
	};

	return exports;

});