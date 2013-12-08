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
			from: { owner: 'server', instance: socket.id }
		});
		socket.removeAllListeners();
	});
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
	this.pubSub.publish(message);
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

exports.MessageBus.prototype.register = function (messageName, instance, callback) {
	return this.pubSub.subscribe(callback, function (message) {
		return instance === message.from.instance && messageName === message.name;
	});
};

exports.MessageBus.prototype.unregister = function (token) {
	this.pubSub.unsubscribe(token);
};

exports.MessageBus.prototype.unregisterAll = function () {
	this.pubSub.unsubscribeAll();
};