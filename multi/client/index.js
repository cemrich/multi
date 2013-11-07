/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
*/

define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var sessionModule = require('session');
	var color = require('../shared/color');
	var Q = require('../debs/q');
	var util = require('util');

	var instance = null;

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
		this.color = color;
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
			var error = new Error('autoJoinSessionFailed because no token was found');
			deferred.reject(error);
			return deferred.promise;
		} else {
			return this.joinSession(sessionToken);
		}
	};

	Multi.prototype.autoJoinElseCreateSession = function () {
		return this.autoJoinSession().fail(this.createSession);
	};

	/**
	 * @public
	 * @return promise
	 */
	Multi.prototype.joinSession = function (sessionToken) {
		// console.log('joining session', sessionToken);

		var multi = this;
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
			// TODO: custom error types
			deferred.reject(new Error('joinSessionFailed because there is no connection'));
		});
		socket.on('joinSessionFailed', function () {
			deferred.reject(new Error('joinSessionFailed because there is no such session'));
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

		var multi = this;
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
		socket.on('connect_failed', function () {
			deferred.reject(new Error('connection failed'));
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

	exports.color = color;

});
