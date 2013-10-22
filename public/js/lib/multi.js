
/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/


define('../shared/eventDispatcher',['require','exports','module'],function(require, exports, module) {

	/**
	 * @classdesc Simple event dispatcher from
	 * {@link http://motionharvest.com/2013/02/01/custom-events/}
	 * @mixin
	 * @class
	 */
	exports.EventDispatcher = function () {
		/** 
		 * Map of all currently added callback functions mapped 
		 * to their corresponding events.
		 * @private
		 */
		this.events = {};
	};

	/**
	 * Adds a callback function to the given event.
	 * @param {string}                                      key
	 *  event that should trigger the callback
	 * @param {EventDispatcher.eventCallback} func
	 *  callback that should be called when event is fired
	 */
	exports.EventDispatcher.prototype.on = function (key, func) {
		if (!this.events.hasOwnProperty(key)) {
			this.events[key] = [];
		}
		this.events[key].push(func);
	};

	/**
	 * Removes a callback function from the given event.
	 * @param {string}                                      key
	 *  event that should trigger the callback
	 * @param {EventDispatcher.eventCallback} func
	 *  callback that should be removed
	 */
	exports.EventDispatcher.prototype.off = function (key, func) {
		if (this.events.hasOwnProperty(key)) {
			for (var i in this.events[key]) {
				if (this.events[key][i] === func) {
					this.events[key].splice(i, 1);
				}
			}
		}
	};

	/**
	 * Adds a callback function to the given event. The callback
	 * is only called one and then removed from the given event.
	 * @param {string}                                      key
	 *  event that should trigger the callback
	 * @param {EventDispatcher.eventCallback} func
	 *  callback that should be called when event is fired
	 */
	exports.EventDispatcher.prototype.once = function (key, func) {
		var that = this;
		function callback(dataObj) {
			that.off(key, callback);
			func(dataObj);
		}
		this.on(key, callback);
	};

	/**
	 * Fires the given event and calls all its associated callbacks.
	 * @param {string} key      event that should be triggered
	 * @param {object} dataObj  any object containing more event 
	 * information you wish to add
	 */
	exports.EventDispatcher.prototype.dispatchEvent = function (key, dataObj) {
		if (this.events.hasOwnProperty(key)) {
			dataObj = dataObj || {};
			dataObj.currentTarget = this;
			for (var i in this.events[key]) {
				this.events[key][i](dataObj);
			}
		}
	};

	/**
	 * Generic event callback.
	 * @callback EventDispatcher.eventCallback
	 * @param {object} event  object containing event information
	 */

	return exports.EventDispatcher;
 });

define('player',['require','exports','module','../shared/eventDispatcher'],function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');

	exports.Player = function () {
		
	};

	exports.Player.prototype = new EventDispatcher();
	return exports.Player;

});

define('session',['require','exports','module','../shared/eventDispatcher'],function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');

	exports.Session = function () {
		
	};

	exports.Session.prototype = new EventDispatcher();
	return exports.Session;

});
/**
* Collection of util functions.
* @module client/multi
*/

define('util',['require','exports','module'],function(require, exports, module) {

	/**
	* Inherit the prototype methods from one constructor into another.
	* From the node.js util package. See https://github.com/joyent/node/blob/master/lib/util.js
	*
	* @param {function} ctor Constructor function which needs to inherit the
	* prototype.
	* @param {function} superCtor Constructor function to inherit prototype from.
	*/
	exports.inherits = function(ctor, superCtor) {
		ctor.super_ = superCtor;
		ctor.prototype = Object.create(superCtor.prototype, {
			constructor: {
				value: ctor,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
	};

});
/**
* Entry point for the client side multi library for developing
* multiscreen games.
* @module client/multi
*/

define('index',['require','exports','module','../shared/eventDispatcher','player','session','util'],function(require, exports, module) {

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
define(["index"], function(index) { return index; });