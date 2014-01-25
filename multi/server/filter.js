/* jshint globalstrict: true */
/* global exports */
'use strict';

/**
 * When you want to filter certain outgoing mesages, add a logger for them
 * or something similar, this is the right module. To define your own filter
 * you just have to add your own filter function to this Module. After this
 * can use the {@link SessionOptions} the define the filter chain for your newly
 * created session.
 * 
 * @example
 * // on server side:
 * filterModule = require('multi/server/filter');
 *
 * // some example filters
 * 
 * filterModule.changeMessageFilter = function (message, fromSocket) {
 *   message.myAttribute = 42;
 *   delete message.myOtherAttribute;
 * };
 *
 * // Return true to reject the message. In this case it doesn't get send.
 * filterModule.rejectVolatileFilter = function (message, fromSocket) {
 *   if (message.volatile) {
 *     return true;
 *   }
 * };
 * 
 * filterModule.logger = function (message, fromSocket) {
 *   console.log('outgoing message:', message.name);
 * };
 *
 * @example
 * // on client side:
 * var sessionOptions = {
 *   filter: ['changeMessageFilter', 'rejectVolatileFilter', 'logger']
 * };
 * multi.createSession(sessionOptions);
 * 
 * @module server/filter
 */

/**
 * A simple logger for outgoing messages.
 * @param message
 * @param fromSocket
 */
exports.loggingFilter = function (message, fromSocket) {
	if (fromSocket !== null) {
		fromSocket = fromSocket.id;
	}
	console.log('outgoing message:', message, 'from client:', fromSocket);
};