/**
 * @module client/messages
 * @private
 */
 
define(function(require, exports, module) {

	var EventEmitter = require('events').EventEmitter;

	exports.MessageBus = function (socket) {
		var messageBus = this;

		this.emitter = new EventEmitter();
		this.socket = socket;

		socket.on('disconnect', function (data) {
			messageBus.onSocketMessage('disconnect', data);
		});
		socket.on('sessionMessage', function (data) {
			messageBus.onSocketMessage('sessionMessage', data);
		});
		socket.on('playerJoined', function (data) {
			messageBus.onSocketMessage('playerJoined', data);
		});
		socket.on('playerMessage', function (data) {
			messageBus.onSocketMessage('playerMessage', data);
		});
		socket.on('playerAttributesChanged', function (data) {
			messageBus.onSocketMessage('playerAttributesChanged', data);
		});
		socket.on('playerLeft', function (data) {
			messageBus.onSocketMessage('playerLeft', data);
		});
	};

	exports.MessageBus.prototype.onSocketMessage = function (messageName, messageData) {
		console.log(messageName, messageData);
		this.emitter.emit(messageName, messageData);
	};

	exports.MessageBus.prototype.send = function (messageName, messageData) {
		this.socket.emit(messageName, messageData);
	};

	exports.MessageBus.prototype.register = function (messageName, callback) {
		this.emitter.on(messageName, callback);
	};

	exports.MessageBus.prototype.unregister = function (messageName, callback) {
		this.emitter.removeListener(messageName, callback);
	};

	exports.MessageBus.prototype.unregisterAll = function (messageName) {
		this.emitter.removeAllListeners(messageName);
	};

	exports.MessageBus.prototype.disconnect = function () {
		this.socket.disconnect();
	};

	return exports;

});