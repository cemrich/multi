/* global exports */

/**
 * @module server/messages
 * @private
 */

var EventEmitter = require('events').EventEmitter;

exports.MessageBus = function (io, token) {
	this.io = io;
	this.token = token;
	this.emitter = new EventEmitter();
};

exports.MessageBus.prototype.addSocket = function (socket) {
	var messageBus = this;
	socket.join(this.token);
	socket.on('playerAttributesClientChanged', function (data) {
		messageBus.onSocketMessage('playerAttributesClientChanged', data);
	});
	socket.on('sessionMessage', function (data) {
		messageBus.onSocketMessage('sessionMessage', data);
	});
	socket.on('playerMessage', function (data) {
		messageBus.onSocketMessage('playerMessage', data);
	});
	socket.on('changePlayerJoining', function (data) {
		messageBus.onSocketMessage('changePlayerJoining', data);
	});
};

exports.MessageBus.prototype.onSocketMessage = function (messageName, messageData) {
	console.log(messageName, messageData);
	this.emitter.emit(messageName, messageData);
};

// sends to ALL sockets in this session
exports.MessageBus.prototype.send = function (messageName, messageData) {
	this.io.sockets.in(this.token).emit(messageName, messageData);
};

// receives events from ALL sockets in this session
exports.MessageBus.prototype.register = function (messageName, callback) {
	this.emitter.on(messageName, callback);
};

exports.MessageBus.prototype.unregister = function (messageName, callback) {
	this.emitter.removeListener(messageName, callback);
};

exports.MessageBus.prototype.unregisterAll = function (messageName) {
	this.emitter.removeAllListeners(messageName);
};

return exports;