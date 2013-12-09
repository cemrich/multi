/* global exports */

/**
 * @module server/messages
 * @private
 */

var util = require('util');
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

exports.MessageBus.prototype.distribute = function (message, socket) {
	var toClient = message.toClient;
	if (toClient === 'all-but-myself' && socket) {
		// send to all but sender
		socket.broadcast.to(this.token).emit('multi', message);
	} else if (util.isArray(toClient)) {
		// send to all ids in array
		var sockets = this.io.sockets.in(this.token).sockets;
		for (var i in toClient) {
			var id = toClient[i];
			if (sockets.hasOwnProperty(id)) {
				sockets[id].emit('multi', message);
			}
		}
	} else if (toClient === 'all' || socket === null) {
		// send to all - default on server
		this.io.sockets.in(this.token).emit('multi', message);
	}
};

exports.MessageBus.prototype.onSocketMessage = function (message, socket) {
	this.distribute(message, socket);
	this.pubSub.publish(message);
};

// sends to ALL sockets in this session
exports.MessageBus.prototype.send = function (message) {
	this.distribute(message, null);
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