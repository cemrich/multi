/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
*/

define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');
	var Player = require('player');
	var Session = require('session');
	var util = require('util');

	var instance = null;

	/**
	* @class
	*/
	var Multi = function (options) {

		EventDispatcher.call(this);
		this.io = options.io;
		this.server = options.server;

	};

	util.inherits(Multi, EventDispatcher);
	
	/**
	 * @public
	 */
	Multi.prototype.joinSession = function (sessionToken) {
		console.log('joining session', sessionToken);
		var multi = this;
		var socket = this.io.connect(this.server, {
				'force new connection': true
			});
		socket.on('connect', function () {
			socket.emit('joinSession', { token: sessionToken });
			socket.on('sessionJoined', function (data) {
				console.log('joined session successfully', data);
				multi.dispatchEvent('sessionJoined', { token: sessionToken });
				// return session, player
			});
		});
	};

	/**
	 * @public
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
				console.log('created session successfully', data);
				multi.dispatchEvent('sessionCreated', { token: data.token });
			});
		});
	};

	/**
	 * @public
	 */
	exports.init = function (options) {
		if (instance === null) {
			instance = new Multi(options);
			return instance;
		} else {
			throw 'only one call to init allowed';
		}
	};

});
