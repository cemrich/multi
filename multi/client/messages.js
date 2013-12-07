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
			messageBus.onSocketMessage({
				name: 'disconnect',
				data: data
			});
		});
		socket.on('multi', function (data) {
			messageBus.onSocketMessage(data);
		});
	};

	exports.MessageBus.prototype.onSocketMessage = function (message) {
		console.log(JSON.stringify(message));
		this.emitter.emit(message.name, message.data);
	};

	exports.MessageBus.prototype.sendToServer = function (messageName, messageData, instance) {
		console.log('sentToServer', messageName, messageData);
		this.socket.emit('multi', {
			name: messageName,
			data: messageData,
			from: { instance: instance }
		});
	};

	exports.MessageBus.prototype.send = function (messageName, messageData, instance) {
		this.socket.emit('multi', {
			name: messageName,
			data: messageData,
			from: { instance: instance },
			redistribute: true
		});
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