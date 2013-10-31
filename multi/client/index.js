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

	var instance = null;

	/**
	* @inner
	* @class
	* @memberof module:client/multi
	* @mixes EventDispatcher
	*/
	var Multi = function (options) {

		EventDispatcher.call(this);
		this.color = color;
		this.io = options.io;
		this.server = options.server;

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
		if (sessionToken !== null) {
			this.joinSession(sessionToken);
		}
	};

	/**
	 * @public
	 * @fires module:client/multi~Multi#sessionJoined
	 */
	Multi.prototype.joinSession = function (sessionToken) {
		console.log('joining session', sessionToken);
		this.dispatchEvent('joiningSessionStarted', { token: sessionToken });
		var multi = this;
		var socket = this.io.connect(this.server, {
				'force new connection': true
			});
		socket.on('connect', function () {
			socket.emit('joinSession', { token: sessionToken });
			socket.on('sessionJoined', function (data) {
				multi.onSession('sessionJoined', data, socket);
			});
		});
		socket.on('connect_failed', function () {
			multi.dispatchEvent('joinSessionFailed', { reason: 'no connection' });
		});
		socket.on('joinSessionFailed', function () {
			multi.dispatchEvent('joinSessionFailed', { reason: 'no such session', token: sessionToken });
		});
	};

	/**
	 * @public
	 * @fires module:client/multi~Multi#sessionCreated
	 */
	Multi.prototype.createSession = function () {
		console.log('creating new session');
		var multi = this;
		var socket = this.io.connect(this.server, {
				'force new connection': true
			});
		socket.on('connect', function () {
			socket.emit('createSession');
			socket.on('sessionCreated', function (data) {
				multi.onSession('sessionCreated', data, socket);
			});
		});
		socket.on('connect_failed', function () {
			multi.dispatchEvent('createSessionFailed', { reason: 'no connection' });
		});
	};

	/**
	 * @event module:client/multi~Multi#sessionCreated
	 */

	/**
	 * @event module:client/multi~Multi#sessionJoined
	 */

	/**
	 * @public
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
