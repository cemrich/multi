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

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var playerModule = require('./player');


	/**
	 * @typedef {Object} SessionOptions
	 * @property {string} [scriptName] name of server side script file that should
	 *  be executed when a new session is created. This module must provide a Game
	 *  constructor that takes a session as only argument.
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


		// PROTECTED
		this.messageBus = null;
		this.messageSender = null;


		// LISTENERS
	

	};

	util.inherits(Session, EventEmitter);


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

	exports.Session = Session;
	return exports;

});