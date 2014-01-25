/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


define(function(require, exports, module) {
	'use strict';

	/**
	 * @classdesc Util class for all objects that allow to send custom messages
	 *  (e.g. player.message('foo', {data: 'bar'})).
	 * @param {module:server/messages~MessageBus|module:client/messages~MessageBus} 
	 *  messageBus message bus instance used for sending the messages
	 * @param {string} instance   instance identifier that should be used for
	 *  the 'fromInstance' attribute of outgoing messages
	 * @private
	 */
	var CustomMessageSender = function (messageBus, instance) {
		this.messageBus = messageBus;
		this.instance = instance;
	};

	/**
	 * Sends a custom message over the message bus.
	 * @param  {string} type     name of the custom message
	 * @param  {*}      [data]   any data to transport
	 * @param  {module:client/multi~toClient|module:server/multi~toClient} 
	 *  [toClient='all'] which client should receive the message
	 * @param  {boolean} [volatile=false] if true, the message may be dropped
	 *  by the framework
	 */
	CustomMessageSender.prototype.message = function (type, data, toClient, volatile) {
		var message = {
			name: 'message',
			fromInstance: this.instance,
			type: type,
			data: data
		};

		message.toClient = toClient || 'all';
		if (typeof message.toClient === 'object') {
			if (message.toClient instanceof Array) {
				for (var i in message.toClient) {
					message.toClient[i] = message.toClient[i].id;
				}
			} else {
				message.toClient = [ message.toClient.id ];
			}
		}

		if (volatile === true) {
			message.volatile = true;
		}

		this.messageBus.send(message);
	};

	
	exports = CustomMessageSender;
	return exports;

});