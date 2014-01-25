/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


define(function(require, exports, module) {
	'use strict';

	/**
	 * @classdesc A simple implementation of the content based
	 * Publish/Suscribe-Pattern as described at
	 * {@link http://msdn.microsoft.com/en-us/library/ff649664.aspx}.
	 * @class PubSub
	 * @private
	 * @example
	 * var pubSub = new PubSub();
	 *
	 * var myCallback = function (message) {
	 *   // this will be called, for any message that
	 *   // is approved by our filter function
	 *   console.log(message);
	 * };
	 * 
	 * pubSub.subscribe(myCallback, function (message) {
	 *   // filter function returning true or false
	 *   return message.topic === 'test' && message.sender === 42;
	 * });
	 *
	 * pubSub.publish({ topic: 'test', sender: 42 }); // myCallback is called
	 * pubSub.publish({ topic: 'test', sender: 0 });  // myCallback is not called
	 */
	var PubSub = function () {
		this.listeners = [];
	};

	/**
	 * Adds a callback funtion that is called for any message published
	 * to this pubSub-instance that is approved by the given filter function.
	 * @param  {function} callback  this will be called for any published message
	 *  that matches the filter function. The massage will be passed as argument.
	 * @param  {function} filter    a filter function acception any message as
	 *  argument and returning true, when the message should be accepted and
	 *  false otherwise.
	 * @return  a token that can be used to unsubscribe this callback-filter-combo
	 * @memberOf PubSub
	 */
	PubSub.prototype.subscribe = function (callback, filter) {
		if (typeof callback !== 'function' || typeof filter !== 'function') {
			throw 'callback and filter have to be a function';
		}
		var token = function (message) {
			if (filter(message)) {
				callback(message);
			}
		};
		this.listeners.push(token);
		return token;
	};

	/**
	 * Removes a callback-filter-combo so they don't receive published messages
	 * any longer.
	 * @param  token  the token to identify the subscription that should
	 *  be removed - returned by the subscribe method	
	 * @memberOf PubSub
	 * @example
	 * var pubSub = new PubSub();
	 *
	 * // subscribe
	 * var token = pubSub.subscribe(myCallback, function (message) {
	 *   return message.receiver === 'xyz';
	 * });
	 * 
	 * // unsubscribe
	 * pubSub.unsubscribe(token);
	 */
	PubSub.prototype.unsubscribe = function (token) {
		var index = this.listeners.indexOf(token);
		if (index !== -1) {
			this.listeners.splice(index, 1);
		}
	};

	/**
	 * Publishes a message in any format to all interested
	 * subscribers.
	 * @param  {*} message
	 * @memberOf PubSub
	 */
	PubSub.prototype.publish = function (message) {
		var listeners = this.listeners;
		for (var i in listeners) {
			listeners[i](message);
		}
	};

	/**
	 * Removes all subscriptions on this instance.
	 * @memberOf PubSub
	 */
	PubSub.prototype.unsubscribeAll = function () {
		this.listeners = [];
	};

	exports = PubSub;
	return exports;

});