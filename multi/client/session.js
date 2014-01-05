/**
 * @module client/session
 * @private
 */

define(function(require, exports, module) {

	var AbstractSession = require('../shared/session').Session;
	var util = require('util');
	var playerModule = require('./player');
	var MessageBus = require('./messages').MessageBus;
	var MessageSender = require('../shared/CustomMessageSender');


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
	* @classdesc A game session that connects and manages multiple players.
	* @inner
	* @class
	* @protected
	* @mixes module:client/events.EventEmitter
	* @memberof module:client/session
	*
	* @param {module:client/player~Player} myself  the player instance that 
	* represents my own client.
	* @param {} messageBus
	* @param {object} sessionData  data object from the server that
	* describes this session
	*/
	var Session = function (myself, messageBus, sessionData) {

		AbstractSession.call(this);

		/**
		 * The player instance that represents my own client.
		 * @type {module:client/player~Player}
		 * @readonly
		 */
		this.myself = myself;
		this.players[myself.id] = myself;

		this.messageBus = messageBus;
		this.messageSender = new MessageSender(this.messageBus, 'session');

		var seializedPlayers = sessionData.players;
		delete sessionData.players;

		// deserialize session attributes
		for (var i in sessionData) {
			this[i] = sessionData[i];
		}
		// deserialize players
		for (i in seializedPlayers) {
			this.onPlayerConnected({ playerData: seializedPlayers[i] });
		}

		// calculate attributes
		/**
		 * URL you have to visit in order to connect to this session.
		 * @type {string}
		 * @readonly
		 */
		this.joinSessionUrl = getJoinSesionUrl(this.token);

		// add messages listeners
		this.onSessionReady();
		this.messageBus.register('disconnect', 'session', this.destroy.bind(this));
		this.messageBus.register('playerJoined', 'session', this.onPlayerConnected.bind(this));
	};

	util.inherits(Session, AbstractSession);

	/**
	 * Creates a player from the given data and adds it to this session.
	 * @private
	 */
	Session.prototype.onPlayerConnected = function (message) {
		var session = this;
		var player = playerModule.deserialize(message.playerData, this.messageBus);
		this.players[player.id] = player;

		player.on('disconnected', function () {
			session.onPlayerDisconnected(player);
		});

		session.emit('playerJoined', { player: player });
		if (session.getPlayerCount() === session.minPlayerNeeded) {
			session.emit('aboveMinPlayerNeeded');
		}
	};

	/**
	 * Removes the given player from this session.
	 * @private
	 */
	Session.prototype.onPlayerDisconnected = function (player) {
		delete this.players[player.id];
		this.emit('playerLeft', { player: player });

		if (this.getPlayerCount() === (this.minPlayerNeeded-1)) {
			this.emit('belowMinPlayerNeeded');
		}
	};

	Session.prototype.disablePlayerJoining = function () {
		this.messageBus.send({
			name: 'changePlayerJoining',
			fromInstance: 'session',
			enablePlayerJoining: false
		});
	};

	Session.prototype.enablePlayerJoining = function () {
		this.messageBus.send({
			name: 'changePlayerJoining',
			fromInstance: 'session',
			enablePlayerJoining: true
		});
	};

	/**
	 * Disconnects own player from this session.
	 * This will remove this player from all existing
	 * instances of this session.
	 * @fires module:shared/session~Session#destroyed
	 */
	Session.prototype.disconnectMyself = function () {
		this.messageBus.disconnect();
	};


	/**
	* Deserializes a session object send over a socket connection.
	* @returns {module:client/session~Session}
	*/
	exports.deserialize = function (data, socket) {
		var messageBus = new MessageBus(socket);
		var myself = playerModule.deserialize(data.player, messageBus);
		var session = new Session(myself, messageBus, data.session);
		return session;
	};

	return exports;

});