/* global exports */

/**
 * @module server/messages
 * @private
 */

var PubSub = require('../shared/PubSub');

exports.MessageBus = function (io, token) {
	this.io = io;
	this.token = token;
	this.pubSub = new PubSub();
};

exports.MessageBus.prototype.addSocket = function (socket) {
	var messageBus = this;
	socket.join(this.token);
	socket.on('disconnect', function () {
		messageBus.pubSub.publish({
			name: 'disconnect',
			fromInstance: socket.id
		});
		socket.removeAllListeners();
	});
	socket.on('multi', function (data) {
		messageBus.onSocketMessage(data, socket);
	});
};

exports.MessageBus.prototype.onSocketMessage = function (message, socket) {
	if (message.redistribute === true) {
		this.send(message);
		// TODO: make it possible to exclude sender:
		// socket.broadcast.to(this.token).emit(messageName, messageData);
	}
	this.pubSub.publish(message);
};

// sends to ALL sockets in this session
exports.MessageBus.prototype.send = function (message) {
	this.io.sockets.in(this.token).emit('multi', message);
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