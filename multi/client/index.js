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
	var util = require('util');
	var Q = require('../debs/q');
	Q.stopUnhandledRejectionTracking();

	var instance = null;


	// custom error types

	var NoSuchSessionError = function () {
		Error.call(this, 'the requested session does not exist');
	};
	util.inherits(NoSuchSessionError, Error);

	var TokenAlreadyExistsError = function () {
		Error.call(this, 'a session with this token does already exist');
	};
	util.inherits(TokenAlreadyExistsError, Error);

	var SessionFullError = function () {
		Error.call('the requested session is full');
	};
	util.inherits(SessionFullError, Error);

	var NoConnectionError = function () {
		Error.call(this, 'no connection to server');
	};
	util.inherits(NoConnectionError, Error);

	var NoSessionTokenFoundError = function () {
		Error.call(this, 'no session token found in url');
	};
	util.inherits(NoSessionTokenFoundError, Error);


	/**
	* @typedef {Object} module:client/multi~MultiOptions
	* @property {socketio}        io        ready to use socket.io module
	* @property                   server    full url of a running socket.io server
	* @property {SessionOptions}  [session] default options for session creation
	*/

	/**
	* @inner
	* @private
	* @class
	* @memberof module:client/multi
	* @mixes EventDispatcher
	* @param {module:client/multi~MultiOptions} options to tweak this instances behaviour  
	*/
	var Multi = function (options) {

		EventDispatcher.call(this);

		this.io = options.io;
		this.server = options.server;
		this.sessionOptions = options.session;
	};

	util.inherits(Multi, EventDispatcher);

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
	 * {@link module:client/multi.NoSuchSessionError NoSuchSessionError}, 
	 * {@link module:client/multi.SessionFullError SessionFullError}, 
	 * {@link module:client/multi.NoSessionTokenFoundError NoSessionTokenFoundError}, 
	 * or {@link module:client/multi.NoConnectionError NoConnectionError}.
	 */
	Multi.prototype.autoJoinSession = function () {
		var sessionToken = getSessionToken();
		if (sessionToken === null) {
			var deferred = Q.defer();
			var error = new NoSessionTokenFoundError();
			deferred.reject(error);
			return deferred.promise;
		} else {
			return this.joinSession(sessionToken);
		}
	};

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
				if (error instanceof NoSessionTokenFoundError) {
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
	 * {@link module:client/multi.NoSuchSessionError NoSuchSessionError}, 
	 * {@link module:client/multi.SessionFullError SessionFullError},
	 * or {@link module:client/multi.NoConnectionError NoConnectionError}.
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
			deferred.reject(new NoConnectionError());
		});
		socket.on('joinSessionFailed', function (data) {
			var error;
			if (data.reason === 'sessionNotFound') {
				error = new NoSuchSessionError();
			} else if (data.reason === 'sessionFull') {
				error = new SessionFullError();
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
	 * {@link module:client/multi.TokenAlreadyExistsError TokenAlreadyExistsError},
	 * or {@link module:client/multi.NoConnectionError NoConnectionError}.
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
				deferred.reject(new TokenAlreadyExistsError());
			}
		});
		socket.on('connect_failed', function () {
			deferred.reject(new NoConnectionError());
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
	 * A promise object provided by the q promise library.
	 * @external Promise
	 * @see {@link https://github.com/kriskowal/q/wiki/API-Reference}
	 */

	/**
	 * The built in error object.
	 * @external Error
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
	 */

	/**
	 * @classdesc The session you were looking for was not found
	 * on the server. Most likely the token has been misspelled.
	 * @class
	 * @mixes external:Error
	 */
	exports.NoSuchSessionError = NoSuchSessionError;

	/**
	 * @classdesc There could be no valid session token extracted
	 * from the url. You may want to check if the current url has
	 * the format http://myGameUrl/some/game#myToken
	 * @class
	 * @mixes external:Error
	 */
	exports.NoSessionTokenFoundError = NoSessionTokenFoundError;

	/**
	 * @classdesc The session you wanted to join already has enough
	 * players. This happens when there are as many or more players 
	 * connected as defined in 
	 * {@link module:client/session~Session#maxPlayerAllowed maxPlayerAllowed}.
	 * @class
	 * @mixes external:Error
	 */
	exports.SessionFullError = SessionFullError;
	/**
	 * @classdesc You are not able to create or join a session
	 * because there is no connection to the server. Maybe the
	 * socket.io settings are wrong or the internet connection
	 * dropped.
	 * @class
	 * @mixes external:Error
	 */
	exports.NoConnectionError = NoConnectionError;
	/**
	 * @classdesc The session you wanted to create already exists.
	 * This can happen when you have configured a static session 
	 * token inside the {@link SessionOptions} and are trying to 
	 * create this session more than once. Closing any open tabs
	 * connected to this session may solve your problem.
	 * @class
	 * @mixes external:Error
	 */
	exports.TokenAlreadyExistsError = TokenAlreadyExistsError;

	/**
	 * @see module:shared/color
	 */
	exports.color = color;
	/**
	 * @see EventDispatcher
	 */
	exports.EventDispatcher = EventDispatcher;
	/**
	 * @see module:client/util
	 */
	exports.util = util;

});
