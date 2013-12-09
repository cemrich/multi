/**
 * @module client/session
 * @private
 */

define(function(require, exports, module) {

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var playerModule = require('./player');
	var MessageBus = require('./messages').MessageBus;


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
	* @param {} messageBus ........
	* @param {object} sessionData  data object from the server that
	* describes this session
	*/
	var Session = function (myself, messageBus, sessionData) {

		EventEmitter.call(this);
		var session = this;

		/**
		 * The player instance that represents my own client.
		 * @type {module:client/player~Player}
		 * @readonly
		 */
		this.myself = myself;
		this.messageBus = messageBus;
		/**
		 * Dictionary of all players except myself currently 
		 * connected to this session; mapped on their ids.
		 * @type {Object.<string, module:client/player~Player>}
		 * @readonly
		 */
		this.players = {};
		/** 
		 * unique token identifying this session
		 * @type {string}
		 * @readonly
		 */
		this.token = null;
		/**
		 * @see SessionOptions
		 * @readonly
		 */
		this.minPlayerNeeded = null;
		/**
		 * @see SessionOptions
		 * @readonly
		 */
		this.maxPlayerAllowed = null;

		var packedPlayers = sessionData.players;
		delete sessionData.players;

		// unpack session attributes
		for (var i in sessionData) {
			this[i] = sessionData[i];
		}
		// unpack players
		for (i in packedPlayers) {
			this.onPlayerConnected({ playerData: packedPlayers[i] });
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

	util.inherits(Session, EventEmitter);

	/**
	 * @return {integer} number of currently connected players including myself
	 */
	Session.prototype.getPlayerCount = function () {
		return Object.keys(this.players).length + 1;
	};

	/**
	 * Creates a player from the given data and adds it to this session.
	 * @private
	 */
	Session.prototype.onPlayerConnected = function (message) {
		var session = this;
		var player = playerModule.fromPackedData(message.playerData, this.messageBus);
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
	 * @returns {Array.<module:client/player~Player>} an array of all 
	 * players currently connected to this session including myself.
	 * The array is sorted by 
	 * {@link module:client/player~Player#number player numbers} 
	 * from small to high.
	 */
	Session.prototype.getPlayerArray = function () {
		var playerArray = [];
		for(var i in this.players) {
			playerArray.push(this.players[i]);
		}
		playerArray.push(this.myself);
		return playerArray.sort(playerModule.compare);
	};

	/**
	 * @returns {module:client/player~Player} the player with the
	 * given {@link module:client/player~Player#number player numbers} 
	 * (even if this is myself) or null if no player with this number 
	 * exists
	 */
	Session.prototype.getPlayerByNumber = function (number) {
		for (var i in this.players) {
			var player = this.players[i];
			if (player.number === number) {
				return player;
			}
		}
		if (this.myself.number === number) {
			return this.myself;
		}
		return null;
	};

	/**
	 * @returns {module:client/player~Player} the player with the
	 * given {@link module:client/player~Player#id id} 
	 * (even if this is myself) or null if no player with this id 
	 * exists
	 */
	Session.prototype.getPlayerById = function (id) {
		if (this.players.hasOwnProperty(id)) {
			return this.players[id];
		}
		if (this.myself.id === id) {
			return this.myself;
		}
		return null;
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
	* @example
	* // on client no 1
	* session.on('ping', function (event) {
	*   // outputs 'bar'
	*   console.log(event.data.foo);
	* });
	* // on client no 2, instance of same session
	* session.message('ping', { foo: 'bar' });
	*/
	Session.prototype.message = function (type, data, toClient) {
		var message = {
			name: 'message',
			fromInstance: 'session',
			type: type,
			data: data
		};
		message.toClient = toClient || 'all';
		if (typeof message.toClient === 'object' &&
			message.toClient instanceof playerModule.Player) {
			message.toClient = [ message.toClient.id ];
		}
		this.messageBus.send(message);
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
	* Unpacks a session object send over a socket connection.
	* @returns {module:client/session~Session}
	*/
	exports.fromPackedData = function (data, socket) {
		var messageBus = new MessageBus(socket);
		var myself = playerModule.fromPackedData(data.player, messageBus);
		var session = new Session(myself, messageBus, data.session);
		return session;
	};

	return exports;

});