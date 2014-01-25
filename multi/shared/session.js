/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


/**
 * @module shared/session
 * @private
 */
define(function(require, exports, module) {
	'use strict';

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var playerModule = require('./player');


	/**
	 * @typedef {Object} SessionOptions
	 * @property {string} [scriptName] name of server side script file that should
	 *  be executed when a new session is created. This module must export a 
	 *  constructor that takes a session as its only argument (module.exports = 
	 *  function (session)). This property has to contain only numbers (0-9) and 
	 *  letters (A-Za-z) for security reasons. Multi will look for the given module
	 *  name inside a 'games' directory that lies next to the multi directory.
	 * @property {string} [token.func='numeric']  name of a function inside the 
	 *  {@link module:server/token} module that should generate the session token
	 * @property {Array}  [token.args=[]]   argument array for the token 
	 *  generationfunction
	 * @property {integer}[minPlayerNeeded=1] minimum number of players needed 
	 *  for this session
	 * @property {integer}[maxPlayerAllowed=10] maximum number of players allowed 
	 *  for this session. Every addition player won't be allowed to join the session.
	 * @property {Array.<string>}[filter] list of names of filter functions. 
	 *  The functions have to be defined in {@link module:server/filter} and will 
	 *  then be used to filter outgoing server-messages.
	 */


	/**
	 * @classdesc A game session that connects and manages multiple players.
	 *
	 * @mixes external:EventEmitter
	 * @memberof module:shared/session
	 * @class
	 * @inner
	 * @protected
	 *
	 * @see module:client/session~Session
	 * @see module:server/session~Session
	 *
	 * @fires module:shared/session~Session#playerJoined
	 * @fires module:shared/session~Session#playerLeft
	 * @fires module:shared/session~Session#destroyed
	 * @fires module:shared/session~Session#belowMinPlayerNeeded
	 * @fires module:shared/session~Session#aboveMinPlayerNeeded
	 */
	var Session = function (messageBus) {

		EventEmitter.call(this);

		// PUBLIC
		/** 
		 * unique token identifying this session
		 * @type {string}
		 * @readonly
		 */
		this.token = null;
		/**
		 * Dictionary of all players currently connected
		 * to this session mapped on their ids.
		 * @type {Object.<string, module:shared/player~Player>}
		 * @readonly
		 */
		this.players = {};
		/**
		 * @see SessionOptions
		 * @readonly
		 */
		this.minPlayerNeeded = 1;
		/**
		 * @see SessionOptions
		 * @readonly
		 */
		this.maxPlayerAllowed = 10;
		/**
		 * if false no more clients are allowed to join this session
		 * @private
		 */
		this.playerJoiningEnabled = true;


		// PROTECTED
		this.messageBus = null;
		this.messageSender = null;
	};

	util.inherits(Session, EventEmitter);

	/**
	 * Child classes should call this method when they are finished building 
	 * and are ready to add listeners to themselves.
	 * @protected
	 */
	Session.prototype.onSessionReady = function () {
		var session = this;

		this.messageBus.register('message', 'session', function (message) {
			session.emit(message.type,  { type: message.type, data: message.data });
		});

		this.messageBus.register('changePlayerJoining', 'session', function (message) {
			session.playerJoiningEnabled = message.playerJoiningEnabled;
		});
	};

	/**
	 * Deconstructs this session when no longer needed and informs listening
	 * objects.
	 * @protected
	 */
	Session.prototype.destroy = function () {
		this.emit('destroyed');
		this.messageBus.unregisterAll();
		this.removeAllListeners();
	};

	/**
	 * Adds the given player to this session. Override if needed.
	 * @param player {module:shared/player~Player} player instance to add
	 * @fires module:shared/session~Session#playerJoined
	 * @protected
	 */
	Session.prototype.addPlayer = function (player) {
		var session = this;

		// add to collection
		this.players[player.id] = player;

		// add listeners
		player.on('disconnected', function () {
			session.removePlayer(player);
		});

		// inform others about this player
		session.emit('playerJoined', { player: player });
		if (session.getPlayerCount() === session.minPlayerNeeded) {
			session.emit('aboveMinPlayerNeeded');
		}
		if (session.getPlayerCount() === session.maxPlayerAllowed) {
			session.emit('aboveMaxPlayerNeeded');
		}
	};

	/**
	 * Removes the given player from this session. Override if needed.
	 * @param player {module:shared/player~Player} player instance to remove
	 * @fires module:shared/session~Session#playerRemoved
	 * @protected
	 */
	Session.prototype.removePlayer = function (player) {
		delete this.players[player.id];
		this.emit('playerLeft', { player: player });

		if (this.getPlayerCount() === (this.minPlayerNeeded-1)) {
			this.emit('belowMinPlayerNeeded');
		}
		if (this.getPlayerCount() === (this.maxPlayerNeeded-1)) {
			this.emit('belowMaxPlayerNeeded');
		}
	};

	/**
	 * @returns {Array.<module:shared/player~Player>} an array of all 
	 * players currently connected to this session.
	 * The array is sorted by 
	 * {@link module:shared/player~Player#number player numbers} 
	 * from small to high.
	 */
	Session.prototype.getPlayerArray = function () {
		var playerArray = [];
		for(var i in this.players) {
			playerArray.push(this.players[i]);
		}
		return playerArray.sort(playerModule.compare);
	};

	/**
	 * @return {integer} number of currently connected players including myself
	 */
	Session.prototype.getPlayerCount = function () {
		return Object.keys(this.players).length;
	};

	/**
	 * @returns {module:shared/player~Player} the player with the
	 * given {@link module:shared/player~Player#number player numbers} 
	 * (even if this is myself) or null if no player with this number 
	 * exists
	 */
	Session.prototype.getPlayerByNumber = function (number) {
		var players = this.getPlayerArray().filter(function (player) {
			return player.number === number;
		});
		return players[0] || null;
	};

	/**
	 * @returns {module:shared/player~Player} the player with the
	 * given {@link module:shared/player~Player#id id} 
	 * (even if this is myself) or null if no player with this id 
	 * exists
	 */
	Session.prototype.getPlayerById = function (id) {
		return this.players[id] || null;
	};

	/**
	 * @return {boolean} true if there are as many ore more players 
	 * connected to this session as are allowed
	 */
	Session.prototype.isFull = function () {
		return this.getPlayerCount() >= this.maxPlayerAllowed;
	};

	/**
	 * When you call this new players are not allowed to join this
	 * session any more. Instead their promise will be rejected with a 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError}.
	 */
	Session.prototype.disablePlayerJoining = function () {
		this.playerJoiningEnabled = false;
		this.messageBus.send({
			name: 'changePlayerJoining',
			fromInstance: 'session',
			playerJoiningEnabled: false
		});
	};

	/**
	 * A call to this method will allow new players to join this session
	 * again.
	 */
	Session.prototype.enablePlayerJoining = function () {
		this.playerJoiningEnabled = true;
		this.messageBus.send({
			name: 'changePlayerJoining',
			fromInstance: 'session',
			playerJoiningEnabled: true
		});
	};

	/**
	 * Sends the given message to all other instances of this session.
	 * @param {string} type    type of message that should be send
	 * @param {object} [data]  message data that should be send
	 * @param {module:client/multi~toClient|module:server/multi~toClient} 
	 *  [toClient='all']  which client should receive this message
	 * @param {boolean} [volatile=false]  if true, the message may be dropped
	 *  by the framework. Use this option for real time data where one dropped
	 *  message does not interrupt your application.
	 * @example
	 * // on client no 1 or server
	 * session.on('ping', function (event) {
	 *   // outputs 'bar'
	 *   console.log(event.data.foo);
	 * });
	 * // on client no 2 or server, instance of same session
	 * session.message('ping', { foo: 'bar' });
	 */
	Session.prototype.message = function (type, data, toClient, volatile) {
		this.messageSender.message(type, data, toClient, volatile);
	};

	/**
	 * Prepares this session and all its players for sending 
	 * it via socket message while avoiding circular dependencies.
	 * @return {object} serialized session object including players
	 */
	Session.prototype.serialize = function() {
		var players = [];
		for (var i in this.players) {
			players.push(this.players[i].serialize());
		}
		return {
			token: this.token,
			players: players,
			minPlayerNeeded: this.minPlayerNeeded,
			maxPlayerAllowed: this.maxPlayerAllowed
		};
	};

	/**
	 * Fired when this session is no longer valid. <br>
	 * The reason could be a broken connection or the
	 * removal of your own player. <br><br>
	 * Don't use this session any longer after the event 
	 * has been fired.
	 * @event module:shared/session~Session#destroyed
	 */

	/**
	 * Fired when a new player has been added to this session.
	 * From now on you can safely communicate with this player.
	 * @event module:shared/session~Session#playerJoined
	 * @property {module:shared/player~Player} player  The newly added player.
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
	 * @event module:shared/session~Session#playerLeft
	 * @property {module:shared/player~Player} player  The removed player.
	 */

	/**
	 * Fired when a player has been removed from this session and
	 * there are now less player connected to this session than stated 
	 * in minPlayerNeeded.<br><br>
	 * You could listen for this event to stop a running game when
	 * the player count is getting to low.
	 * @event module:shared/session~Session#belowMinPlayerNeeded
	 */

	/**
	 * Fired when a new player has been added to this session and
	 * there are now exactly as many players connected to this session
	 * as stated in minPlayerNeeded.<br><br>
	 * You could listen for this event to start your game when
	 * enough players have connected.
	 * @event module:shared/session~Session#aboveMinPlayerNeeded
	 */

	/**
	 * Fired when a new player has been added to this session and
	 * there are now exactly as many players connected to this session
	 * as stated in maxPlayerAllowed.
	 * @event module:shared/session~Session#aboveMaxPlayerAllowed
	 */

	/**
	 * Fired when a player has been removed from this session and
	 * there are now less player connected to this session than stated 
	 * in maxPlayerNeeded.
	 * @event module:shared/session~Session#belowMaxPlayerAllowed
	 */


	exports.Session = Session;
	return exports;

});