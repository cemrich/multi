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
	* @fires module:client/session~Session#playerJoined
	* @fires module:client/session~Session#playerLeft
	* @fires module:client/session~Session#destroyed
	* @fires module:client/session~Session#belowMinPlayerNeeded
	* @fires module:client/session~Session#aboveMinPlayerNeeded
	*
	* @param {module:client/player~Player} myself  the player instance that 
	* represents my own client.
	* @param {} messageBus
	* @param {object} sessionData  data object from the server that
	* describes this session
	*/
	var Session = function (myself, messageBus, sessionData) {

		AbstractSession.call(this);
		var session = this;

		/**
		 * The player instance that represents my own client.
		 * @type {module:client/player~Player}
		 * @readonly
		 */
		this.myself = myself;
		this.players[myself.id] = myself;

		this.messageBus = messageBus;

		this.messageSender = new MessageSender(messageBus, 'session');

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
		this.messageBus.register('disconnect', 'session', function (message) {
			session.emit('destroyed');
			session.messageBus.unregisterAll();
			session.removeAllListeners();
		});
		this.messageBus.register('message', 'session', function (message) {
			session.emit(message.type,  { type: message.type, data: message.data });
		});
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

	/**
	 * When you call this new players are not allowed to join this
	 * session any more. Instead their promise will be rejected with a 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError}.
	 */
	Session.prototype.disablePlayerJoining = function () {
		this.messageBus.send({
			name: 'changePlayerJoining',
			fromInstance: 'session',
			enablePlayerJoining: false
		});
	};

	/**
	 * A call to this method will allow new players to join this session
	 * again.
	 */
	Session.prototype.enablePlayerJoining = function () {
		this.messageBus.send({
			name: 'changePlayerJoining',
			fromInstance: 'session',
			enablePlayerJoining: true
		});
	};

	/**
	 * Sends the given message to all other instances of this session.
	 * @param {string} type    type of message that should be send
	 * @param {object} [data]  message data that should be send
	 * @param {module:client/multi~toClient} [toClient='all']  which client
	 *  should receive this message
	 * @param {boolean} [volatile=false]  if true, the message may be dropped
	 *  by the framework. Use this option for real time data where one dropped
	 *  message does not interrupt your application.
	 * @example
	 * // on client no 1
	 * session.on('ping', function (event) {
	 *   // outputs 'bar'
	 *   console.log(event.data.foo);
	 * });
	 * // on client no 2, instance of same session
	 * session.message('ping', { foo: 'bar' });
	 */
	Session.prototype.message = function (type, data, toClient, volatile) {
		this.messageSender.message(type, data, toClient, volatile);
	};

	/**
	 * Disconnects own player from this session.
	 * This will remove this player from all existing
	 * instances of this session.
	 * @fires module:client/session~Session#destroyed
	 */
	Session.prototype.disconnectMyself = function () {
		this.messageBus.disconnect();
	};


	/**
	 * Fired when this session is no longer valid. <br>
	 * The reason could be a broken connection or the
	 * removal of your own player. <br><br>
	 * Don't use this session any longer after the event 
	 * has been fired.
	 * @event module:client/session~Session#destroyed
	 */

	/**
	 * Fired when a new player has been added to this session.
	 * From now on you can safely communicate with this player.
	 * @event module:client/session~Session#playerJoined
	 * @property {module:client/player~Player} player  The newly added player.
	 * @example <caption>Adding connected players to the DOM</caption>
	 * session.on('playerJoined', function (event) {
	 *   var playerDiv = $('#player').clone();
	 *   $('#players').append(playerDiv);
	 *   event.player.on('disconnected', function () {
	 *     playerDiv.remove();
	 *   });
	 * }
	 */

	/**
	 * Fired when a player has been removed from this session.
	 * @event module:client/session~Session#playerLeft
	 * @property {module:client/player~Player} player  The removed player.
	 */

	/**
	 * Fired when a player has been removed from this session and
	 * there are now less player connected to this session than stated 
	 * in minPlayerNeeded.<br><br>
	 * You could listen for this event to stop a running game when
	 * the player count is getting to low.
	 * @event module:client/session~Session#belowMinPlayerNeeded
	 */

	/**
	 * Fired when a new player has been added to this session and
	 * there are now exactly as many players connected to this session
	 * as stated in minPlayerNeeded.<br><br>
	 * You could listen for this event to start your game when
	 * enough players have connected.
	 * @event module:client/session~Session#aboveMinPlayerNeeded
	 */

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