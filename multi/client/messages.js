/**
 * @module client/messages
 * @private
 */
 
define(function(require, exports, module) {

	exports.MessageBus = function (socket) {
		var messageBus = this;

		this.socket = socket;
		this.listeners = [];

		socket.on('disconnect', function (data) {
			messageBus.onSocketMessage({
				name: 'disconnect',
				from: { instance: 'session' },
				data: data
			});
		});
		socket.on('multi', function (data) {
			messageBus.onSocketMessage(data);
		});
	};

	exports.MessageBus.prototype.onSocketMessage = function (message) {
		// console.log(JSON.stringify(message));
		var listeners = this.listeners;
		for (var i in listeners) {
			listeners[i](message);
		}
	};

	exports.MessageBus.prototype.sendToServer = function (messageName, messageData, instance) {
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

	exports.MessageBus.prototype.register = function (messageName, instance, callback) {
		var registerFunc = function (message) {
			if (instance === message.from.instance && messageName === message.name) {
				callback(message);
			}
		};
		this.listeners.push(registerFunc);
		return registerFunc;
	};

	exports.MessageBus.prototype.unregister = function (register) {
		var index = this.listeners.indexOf(register);
		if (index !== -1) {
			this.listeners.splice(index, 1);
		}
	};

	exports.MessageBus.prototype.unregisterAll = function () {
		this.listeners = [];
	};

	exports.MessageBus.prototype.disconnect = function () {
		this.socket.disconnect();
	};

	return exports;

});