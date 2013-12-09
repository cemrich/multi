/**
 * @module client/messages
 * @private
 */
 
define(function(require, exports, module) {

	var PubSub = require('../shared/pubSub');

	exports.MessageBus = function (socket) {
		var messageBus = this;

		this.socket = socket;
		this.pubSub = new PubSub();

		socket.on('disconnect', function (data) {
			messageBus.onSocketMessage({
				name: 'disconnect',
				fromInstance: 'session',
				data: data
			});
		});
		socket.on('multi', function (data) {
			messageBus.onSocketMessage(data);
		});
	};

	exports.MessageBus.prototype.onSocketMessage = function (message) {
		// console.log(JSON.stringify(message));
		this.pubSub.publish(message);
	};

	exports.MessageBus.prototype.sendToServer = function (messageName, messageData, instance) {
		this.socket.emit('multi', {
			name: messageName,
			data: messageData,
			fromInstance: instance
		});
	};

	exports.MessageBus.prototype.send = function (messageName, messageData, instance) {
		this.socket.emit('multi', {
			name: messageName,
			data: messageData,
			fromInstance: instance,
			redistribute: true
		});
	};

	exports.MessageBus.prototype.register = function (messageName, instance, callback) {
		return this.pubSub.subscribe(callback, function (message) {
			return instance === message.fromInstance && messageName === message.name;
		});
	};

	exports.MessageBus.prototype.unregister = function (token) {
		this.pubSub.unsubscribe(token);
	};

	exports.MessageBus.prototype.unregisterAll = function () {
		this.pubSub.unsubscribeAll();
	};

	exports.MessageBus.prototype.disconnect = function () {
		this.socket.disconnect();
	};

	return exports;

});