/**
 * @module client/messages
 * @private
 */
 
define(function(require, exports, module) {
	'use strict';

	var PubSub = require('../shared/PubSub');

	/**
	 * @classdesc Centralized communication infrastructure for one session.
	 * Every session or player can send messages to the outside world
	 * and subscribe to messages, using a custom filter.
	 * @class
	 * @param socket socket.io socket instance that connects the
	 *  using session to the outside world
	 * @private
	 */
	exports.MessageBus = function (socket) {
		var messageBus = this;

		this.socket = socket;
		this.pubSub = new PubSub();

		socket.on('disconnect', function () {
			messageBus.onSocketMessage({
				name: 'disconnect',
				fromInstance: 'session'
			});
		});
		socket.on('multi', function (data) {
			messageBus.onSocketMessage(data);
		});
	};

	/**
	 * The socket send a message - publish it to all subscribers.
	 * @private
	 */
	exports.MessageBus.prototype.onSocketMessage = function (message) {
		// console.log(JSON.stringify(message));
		this.pubSub.publish(message);
	};

	/**
	 * Sends the given message to the server and the instances of the sender
	 * (fromInstance) on all other clients (including the sending client) by 
	 * default. <br><br>
	 * You can set message.toClient to: <br>
	 * <ul>
	 * <li>'all' - default behaviour </li>
	 * <li>'all-but-myself' - message does not return to sending client (broadcast) </li>
	 * <li>['id1', 'id2'] - message will be send to all clients whose IDs are 
	 * inside the array </li>
	 * </ul>
	 * Use this option to save bandwidth.<br><br>
	 * Message that have set message.volatile=true may be dropped by the framework.
	 * 
	 * @param  {object} message
	 * @example
	 * messageBus.send({
	 *   name: 'myEvent',
	 *   fromInstance: 'playerXYZ',
	 *   toClient: 'all-but-myself',
	 *   data1: 'mydata',
	 *   data2: 42
	 * });
	 */
	exports.MessageBus.prototype.send = function (message) {
		this.socket.emit('multi', message);
	};

	/**
	 * Register a callback for messages from the outside world.
	 * @param  {string}   messageName  on which message name you would like to register?
	 * @param  {string}   instance     messages from which instance do interest you?
	 * @param  {Function} callback     function to call when a corresponding message
	 *  is received (message name _and_ instance correspond to arguments)
	 * @return {}                      token to unregister this callback again
	 */
	exports.MessageBus.prototype.register = function (messageName, instance, callback) {
		return this.pubSub.subscribe(callback, function (message) {
			return instance === message.fromInstance && messageName === message.name;
		});
	};

	/**
	 * Unrigister a callback you registered earlier.
	 * @param  {} token  register token returned by 'register' method
	 * @example
	 * // register
	 * token = messageBus.register('myEventName', myId, callback);
	 * // ... do something ...
	 * // unregister again
	 * messageBus.unregister(token);
	 */
	exports.MessageBus.prototype.unregister = function (token) {
		this.pubSub.unsubscribe(token);
	};

	/**
	 * Unregister all callbacks from this MessageBus instance.
	 */
	exports.MessageBus.prototype.unregisterAll = function () {
		this.pubSub.unsubscribeAll();
	};

	return exports;

});