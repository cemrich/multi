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
	socket.on('playerAttributesChanged', function (data) {
		messageBus.onSocketMessage('playerAttributesChanged', data, socket);
	});
	socket.on('sessionMessage', function (data) {
		messageBus.onSocketMessage('sessionMessage', data, socket);
	});
	socket.on('playerMessage', function (data) {
		messageBus.onSocketMessage('playerMessage', data, socket);
	});
	socket.on('changePlayerJoining', function (data) {
		messageBus.onSocketMessage('changePlayerJoining', data, socket);
	});
};

exports.MessageBus.prototype.onSocketMessage = function (messageName, messageData, socket) {
	console.log(messageName, messageData);
	messageData.from.owner = socket.id;
	if (messageData.redistribute === true) {
		this._send(messageName, messageData);
		// TODO: make it possible to exclude sender:
		// socket.broadcast.to(this.token).emit(messageName, messageData);
	}
	this.emitter.emit(messageName, messageData.data);
};

// sends to ALL sockets in this session
exports.MessageBus.prototype._send = function (messageName, messageData) {
	this.io.sockets.in(this.token).emit(messageName, messageData);
};

// sends to ALL sockets in this session
exports.MessageBus.prototype.send = function (messageName, messageData) {
	this._send(messageName, {
		from: { owner: 'server' },
		data: messageData
	});
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