/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
* @example
* 
var multiOptions = {
  io: socketio,
  server: 'http://mySocketioServer/'
};

// init and try to create the session
var multi = multiModule.init(multiOptions);
multi.createSession().then(onSession, onSessionFailed).done();
*/

define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var sessionModule = require('session');
	var color = require('../shared/color');
	var errors = require('../shared/errors');
	var util = require('../shared/util');
	var Q = require('../debs/q');
	Q.stopUnhandledRejectionTracking();

	var instance = null;


	/**
	* @typedef {Object} module:client/multi~MultiOptions
	* @property {socketio}        io        ready to use socket.io module
	* @property                   server    full url of a running socket.io server
	* @property {SessionOptions}  [session] default options for session creation
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
		this.io = options.io;
		this.server = options.server;
		this.sessionOptions = options.session;
	};

	function getSessionToken() {
		var sessionToken = window.location.hash.substring(1);

		if (sessionToken === undefined || sessionToken === '') {
			return null;
		} else {
			return sessionToken;
		}
	}

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
		var sessionToken = getSessionToken();
		if (sessionToken === null) {
			var deferred = Q.defer();
			var error = new errors.NoSessionTokenFoundError();
			deferred.reject(error);
			return deferred.promise;
		} else {
			return this.joinSession(sessionToken);
		}
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
	Multi.prototype.autoJoinElseCreateSession = function () {
		var that = this;
		var deferred = Q.defer();

		// TODO: this does work but it stinks!
		// ask someone how to actually code this in a clean way
		this.autoJoinSession().then(
			function (session) {
				deferred.resolve(session);
			},
			function (error) {
				if (error instanceof errors.NoSessionTokenFoundError) {
					that.createSession().then(
						function (session) {
							deferred.resolve(session);
						},
						function (error) {
							deferred.reject(error);
						});
				} else {
					deferred.reject(error);
				}
			});
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
	 *  io: socketio,
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
		var deferred = Q.defer();
		var socket = this.io.connect(this.server, {
				'force new connection': true
			});
		socket.on('connect', function () {
			socket.emit('joinSession', { token: sessionToken });
			socket.on('sessionJoined', function (data) {
				var session = sessionModule.fromPackedData(data, socket);
				deferred.resolve(session);
			});
		});
		socket.on('connect_failed', function () {
			deferred.reject(new errors.NoConnectionError());
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
		return deferred.promise;
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
	 * {@link module:shared/errors.TokenAlreadyExistsError TokenAlreadyExistsError},
	 * or {@link module:shared/errors.NoConnectionError NoConnectionError}.
	 *
	 * @example
	 * var multiOptions = {
	 *  io: socketio,
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
		options = options || this.sessionOptions;

		var deferred = Q.defer();
		var socket = this.io.connect(this.server, {
				'force new connection': true
			});
		socket.on('connect', function () {
			socket.emit('createSession', { options: options });
			socket.on('sessionCreated', function (data) {
				var session = sessionModule.fromPackedData(data, socket);
				deferred.resolve(session);
			});
		});
		socket.on('createSessionFailed', function (event) {
			if (event.reason === 'tokenAlreadyExists') {
				deferred.reject(new errors.TokenAlreadyExistsError());
			}
		});
		socket.on('connect_failed', function () {
			deferred.reject(new errors.NoConnectionError());
		});
		return deferred.promise;
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
	 * @type EventDispatcher
	 */
	exports.EventDispatcher = EventDispatcher;

	/**
	 * @type module:shared/util
	 */
	exports.util = util;

	/**
	 * @type module:shared/color
	 */
	exports.color = color;

});
