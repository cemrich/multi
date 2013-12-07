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
	socket.on('multi', function (data) {
		messageBus.onSocketMessage(data, socket);
	});
};

exports.MessageBus.prototype.onSocketMessage = function (message, socket) {
	console.log(message);
	message.from.owner = socket.id;
	if (message.redistribute === true) {
		this._send(message);
		// TODO: make it possible to exclude sender:
		// socket.broadcast.to(this.token).emit(messageName, messageData);
	}
	this.emitter.emit(message.name, message.data);
};

// sends to ALL sockets in this session
exports.MessageBus.prototype._send = function (message) {
	this.io.sockets.in(this.token).emit('multi', message);
};

// sends to ALL sockets in this session
exports.MessageBus.prototype.send = function (messageName, messageData, instance) {
	this._send({
		name: messageName,
		from: { owner: 'server', instance: instance },
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