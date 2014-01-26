/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
* @example
* // configure where multi can find your client side socket.io lib
requirejs.config({
  paths: {
    'socket.io': '/socket.io/socket.io.js'
  }
});

var multiOptions = {
  server: 'http://mySocketioServer/'
};

// init and try to create the session
var multi = multiModule.init(multiOptions);
multi.createSession().then(onSession, onSessionFailed).done();
*/



define(function(require, exports, module) {
	'use strict';

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var sessionModule = require('./session');
	var color = require('../shared/color');
	var errors = require('../shared/errors');
	var token = require('./token');
	var screensModule = require('../plugins/screens/index');
	var HorizontalArranger = require('../plugins/screens/HorizontalArranger');
	var Q = require('../lib/q');
	var io = require('socket.io');

	Q.stopUnhandledRejectionTracking();

	var instance = null;


	/**
	* @typedef {Object} module:client/multi~MultiOptions
	* @property                   server    full url of a running socket.io server
	* @property {SessionOptions}  [session] default options for session creation
	*/

	/**
	 * @typedef {(string|Array.<string>|module:client/player~Player)} module:client/multi~toClient
	 * @description  Option to determine to which client a message should be send
	 * (not to which _instance_ on this client).<br>
	 * You can set it to:
	 * <ul>
	 * <li>'all' - the message will be send to all clients currently connected to
	 * this session</li>
	 * <li>'all-but-myself' - the message will be send to all clients currently 
	 * connected to this session except the sending client </li>
	 * <li>'server' - the message will be send to the game server only</li>
	 * <li>[player1, player2] - message will be send to all clients that are
	 * represented by players inside this array</li>
	 * <li>myPlayer - the message will be send to the client that is represented
	 * by myPlayer</li>
	 * </ul>
	 */

	/**
	 * A promise object provided by the q promise library.
	 * @external Promise
	 * @see {@link https://github.com/kriskowal/q/wiki/API-Reference}
	 */


	/**
	* @classdesc Use this class to create new sessions or connect to 
	* existing ones. You can get ready a to use instance of this class
	* by initializing the multi framework with 
	* {@link module:client/multi.init multiModule.init(options)}.
	* @inner
	* @protected
	* @memberof module:client/multi
	* @class
	* @param {module:client/multi~MultiOptions} options to tweak this instances behaviour  
	*/
	var Multi = function (options) {
		this.server = options.server;
		this.sessionOptions = options.session;
	};

	/**
	 * Tries to connect to a session that does already exist on the server. 
	 * The session token will be extracted from the URL by using characters 
	 * after the url hash.<br>
	 * As this operation is executed asynchrony a Q promise will be returned.
	 *
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the joined {@link module:client/session~Session Session} instance.<br><br>
	 * On error it will be rejected with either 
	 * {@link module:shared/errors.NoSuchSessionError NoSuchSessionError}, 
	 * {@link module:shared/errors.SessionFullError SessionFullError}, 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError}, 
	 * {@link module:shared/errors.NoSessionTokenFoundError NoSessionTokenFoundError}, 
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 */
	Multi.prototype.autoJoinSession = function () {
		var multi = this;
		return token.extractTokenFromURL().then(function (token) {
			return multi.joinSession(token);
		});
	};

	/**
	 * Tries to auto join an existing session.
	 * When no valid session token can be extracted from the URL a
	 * new session will be created instead.<br>
	 * As this operation is executed asynchrony a Q promise will be returned.
	 *
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the created or joined {@link module:client/session~Session Session} 
	 * instance.<br><br>
	 * On error it will be rejected with either 
	 * {@link module:shared/errors.NoSuchSessionError NoSuchSessionError}, 
	 * {@link module:shared/errors.SessionFullError SessionFullError}, 
	 * {@link module:shared/errors.TokenAlreadyExistsError TokenAlreadyExistsError}, 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError}, 
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 */
	Multi.prototype.autoJoinOrCreateSession = function () {
		var that = this;

		return this.autoJoinSession().catch(function (error) {
			if (error instanceof errors.NoSessionTokenFoundError) {
				return that.createSession();
			} else {
				throw error;
			}
		});
	};

	/**
	 * Opens a socket connection to the configured server.
	 * @return {external:Promise} On success the promise will be resolved with
	 *  the connected socket object. When the connection fails or another error
	 *  (eg. a timeout) occurs, the promise will be rejected with a
	 *  {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 * @private
	 */
	Multi.prototype.openSocketConnection = function () {
		var deferred = Q.defer();
		var socket = io.connect(this.server, {
				reconnect: false,
				'force new connection': true
			});
		socket.on('connect', function () {
			deferred.resolve(socket);
		});

		var onError = function () {
			deferred.reject(new errors.NoConnectionError());
		};
		socket.on('connect_failed', onError);
		socket.on('error', onError);

		return deferred.promise;
	};

	/**
	 * Tries to connect to a session that does already exist on the server. 
	 * As this operation is executed asynchrony a Q promise will be returned.
	 * @param {string} sessionToken  unique token of the session you want
	 * to join
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the joined {@link module:client/session~Session Session} instance.<br><br>
	 * On error it will be rejected with either 
	 * {@link module:shared/errors.NoSuchSessionError NoSuchSessionError}, 
	 * {@link module:shared/errors.SessionFullError SessionFullError}, 
	 * {@link module:shared/errors.JoiningDisabledError JoiningDisabledError},
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 *
	 * @example
	 * var multiOptions = {
	 *  server: 'http://mySocketioServer/'
	 * };
	 *
	 * function onSession(session) {
	 *  console.log('session joined', session.token);
	 * }
	 * function onSessionFailed(error) {
	 *  console.log('session joining failed:', error.message);
	 * }
	 *
	 * // init and join the session
	 * var multi = multiModule.init(multiOptions);
	 * multi.joinSession('123').then(onSession, onSessionFailed).done();
	 */
	Multi.prototype.joinSession = function (sessionToken) {
		var multi = this;
		
		return this.openSocketConnection().then(function (socket) {
			var deferred = Q.defer();

			socket.on('sessionJoined', function (data) {
				var session = sessionModule.deserialize(data, socket);
				deferred.resolve(session);
			});

			socket.on('joinSessionFailed', function (data) {
				var error;
				if (data.reason === 'sessionNotFound') {
					error = new errors.NoSuchSessionError();
				} else if (data.reason === 'sessionFull') {
					error = new errors.SessionFullError();
				} else if (data.reason === 'joiningDisabled') {
					error = new errors.JoiningDisabledError();
				}
				deferred.reject(error);
			});

			socket.emit('joinSession', {
				token: sessionToken,
				playerParams: multi.getPlayerParams()
			});

			return deferred.promise;
		});
	};

	/**
	 * Tries to create a new game session on the server. As this
	 * operation is executed asynchrony a Q promise will be returned.
	 * @param {SessionOptions} [options]  To tweak this new sessions behaviour.
	 * If not provided, the session section of the multiOptions-object will
	 * be used. If that does not exist either the default values will be used.
	 *
	 * @return {external:Promise} On success the promise will be resolved with the 
	 * created {@link module:client/session~Session Session} instance.<br><br>
	 * On error it will be rejected with either 
	 * {@link module:shared/errors.TokenAlreadyExistsError TokenAlreadyExistsError},<br>
	 * {@link module:shared/errors.ScriptNameNotAllowedError ScriptNameNotAllowedError},
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 *
	 * @example
	 * var multiOptions = {
	 *  server: 'http://mySocketioServer/',
	 *  session: {
	 *    minPlayerNeeded: 3,
	 *    maxPlayerAllowed: 5
	 *  }
	 * };
	 *
	 * function onSession(session) {
	 *  console.log('session created', session.token);
	 * }
	 * function onSessionFailed(error) {
	 *  console.log('session creation failed:', error.message);
	 * }
	 *
	 * // init and try to create the session
	 * var multi = multiModule.init(multiOptions);
	 * multi.createSession().then(onSession, onSessionFailed).done();
	 */
	Multi.prototype.createSession = function (options) {
		var multi = this;
		options = options || this.sessionOptions || {};

		return this.openSocketConnection().then(function (socket) {
			var deferred = Q.defer();

			socket.on('sessionCreated', function (data) {
				var session = sessionModule.deserialize(data, socket);
				deferred.resolve(session);
			});

			socket.on('createSessionFailed', function (event) {
				if (event.reason === 'tokenAlreadyExists') {
					deferred.reject(new errors.TokenAlreadyExistsError());
				} else if (event.reason === 'scriptNameNotAllowed') {
					deferred.reject(new errors.ScriptNameNotAllowedError());
				} else {
					deferred.reject(new errors.MultiError(event.reason));
				}
			});

			socket.emit('createSession', {
				options: options,
				playerParams: multi.getPlayerParams()
			});

			return deferred.promise;
		});
	};

	/**
	 * @returns {module:server/player~PlayerParams} an object containing
	 * device information for this client
	 * @private
	 */
	Multi.prototype.getPlayerParams = function () {
		return {
			width: window.innerWidth,
			height: window.innerHeight
		};
	};


	/**
	 * @public
	 * @param {module:client/multi~MultiOptions} options to tweak this modules behaviour  
	 * @returns {module:client/multi~Multi} the one and only Multi instance
	 */
	exports.init = function (options) {
		if (instance === null) {
			instance = new Multi(options);
			return instance;
		} else {
			throw 'only one call to init allowed';
		}
	};


	/**
	 * @type module:shared/errors.MultiError
	 */
	exports.MultiError = errors.MultiError;

	/**
	 * @type module:shared/errors.NoSuchSessionError
	 */
	exports.NoSuchSessionError = errors.NoSuchSessionError;

	/**
	 * @type module:shared/errors.TokenAlreadyExistsError
	 */
	exports.TokenAlreadyExistsError = errors.TokenAlreadyExistsError;

	/**
	 * @type module:shared/errors.SessionFullError
	 */
	exports.SessionFullError = errors.SessionFullError;

	/**
	 * @type module:shared/errors.NoConnectionError
	 */
	exports.NoConnectionError = errors.NoConnectionError;

	/**
	 * @type module:shared/errors.NoSessionTokenFoundError
	 */
	exports.NoSessionTokenFoundError = errors.NoSessionTokenFoundError;

	/**
	 * @type module:shared/errors.JoiningDisabledError
	 */
	exports.JoiningDisabledError = errors.JoiningDisabledError;

	/**
	 * @type module:shared/errors.ScriptNameNotAllowedError
	 */
	exports.ScriptNameNotAllowedError = errors.ScriptNameNotAllowedError;

	/**
	 * @type module:client/events.EventEmitter
	 */
	exports.EventEmitter = EventEmitter;

	/**
	 * @type module:client/util
	 */
	exports.util = util;

	/**
	 * @type module:shared/color
	 */
	exports.color = color;

	/**
	 * @type module:client/token
	 */
	exports.token = token;

	/**
	 * @type module:plugins/screens
	 */
	exports.screens = screensModule;
	exports.screens.HorizontalArranger = HorizontalArranger;

});
