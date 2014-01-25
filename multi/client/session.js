/**
 * @module client/session
 * @private
 */

define(function(require, exports, module) {
	'use strict';

	var AbstractSession = require('../shared/session').Session;
	var util = require('util');
	var playerModule = require('./player');
	var MessageBus = require('./messages').MessageBus;
	var MessageSender = require('../shared/CustomMessageSender');


	/**
	* @classdesc A game session that connects and manages multiple players on 
	* the client side.
	* @inner
	* @class
	* @protected
	* @mixes module:shared/session~Session
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

		this.applySessionData(sessionData);

		/**
		 * URL you have to visit in order to connect to this session.
		 * @type {string}
		 * @readonly
		 */
		this.joinSessionUrl = getJoinSesionUrl(this.token);

		// add messages listeners
		this.onSessionReady();
		this.messageBus.register('disconnect', 'session', this.destroy.bind(this));
		this.messageBus.register('playerJoined', 'session', this.onPlayerJoined.bind(this));
		window.addEventListener('unload', function () {
			myself.disconnect();
		});
	};

	util.inherits(Session, AbstractSession);


	/* private */

	/**
	 * Deserializes the given sessionData onto this session.
	 * @private
	 */
	Session.prototype.applySessionData = function (sessionData) {
		var seializedPlayers = sessionData.players;
		delete sessionData.players;

		// deserialize session attributes
		for (var i in sessionData) {
			this[i] = sessionData[i];
		}
		// deserialize players
		for (i in seializedPlayers) {
			this.onPlayerJoined({ playerData: seializedPlayers[i] });
		}
	};

	/**
	 * Creates a player from the given data and adds it to this session.
	 * @private
	 */
	Session.prototype.onPlayerJoined = function (message) {
		var player = playerModule.deserialize(message.playerData, this.messageBus);
		this.addPlayer(player);
	};



	/* module functions */

	function getJoinSesionUrl(token) {
		var url = window.location.host;
		if (window.location.port !== '' && window.location.port !== '80') {
			url += ':' + window.location.port;
		}
		url += window.location.pathname + '#' + token;
		return url;
	}

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