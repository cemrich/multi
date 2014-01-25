/**
* Simple wrapper, so you can require('events') on client side
* without using browserify.
* @module client/events
*/

define(function(require, exports, module) {
	'use strict';

	/**
	 * @classdesc EventEmitter from from socket.io
	 * @mixin
	 * @class
	 * @see {@link https://github.com/LearnBoost/socket.io-client/blob/master/lib/emitter.js}
	 */
	exports.EventEmitter = require('socket.io').EventEmitter;

});