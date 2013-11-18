/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
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

		this.onSession = function (eventString, data, socket) {
			var session = sessionModule.fromPackedData(data, socket);
			var event = { session: session };
			this.dispatchEvent(eventString, event);
		};
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
	 * @public
	 * @return promise
	 */
	Multi.prototype.joinSession = function (sessionToken) {
		// console.log('joining session', sessionToken);

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
	 * @public
	 * @param {SessionOptions} [options]  to tweak this new sessions behaviour
	 * @return promise
	 */
	Multi.prototype.createSession = function (options) {
		// console.log('creating new session');

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

	exports.NoSuchSessionError = NoSuchSessionError;
	exports.SessionFullError = SessionFullError;
	exports.NoConnectionError = NoConnectionError;
	exports.TokenAlreadyExistsError = TokenAlreadyExistsError;

	exports.color = color;
	exports.EventDispatcher = EventDispatcher;
	exports.util = util;

});
