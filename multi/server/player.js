/**
 * @module server/player
 */

var util = require('util');
var WatchJS = require('../debs/watch');
var EventDispatcher = require('../shared/eventDispatcher');

/**
 * @mixes EventDispatcher
 * @class
 * @protected
 * @param {socket.io-socket} socket  communication socket for the new player
 */
var Player = function (socket) {

	var player = this;

	/** 
	 * communication socket for this player
	 * @type {socket.io-socket}
	 * @private
	 */
	this.socket = socket;
	/** 
	 * unique id for this player
	 * @type {number}
	 * @readonly
	 */
	this.id = socket.id;

	this.attributes = { };

	EventDispatcher.call(this);

	WatchJS.watch(this.attributes, this.onAttributesChange.bind(this), 0, true);

	this.socket.on('disconnect', function(event) {
		WatchJS.unwatch(player.attributes, player.onAttributesChange);
		player.dispatchEvent('disconnected');
	});
};

/* class methods */
util.inherits(Player, EventDispatcher);

Player.prototype.onAttributesChange = function (prop, action, newvalue, oldvalue) {
	//console.log(prop+" - action: "+action+" - new: "+newvalue+", old: "+oldvalue);
	this.dispatchEvent('attributesChanged');
};

Player.prototype.pack = function () {
	return { 
		id: this.id,
		attributes: this.attributes
	};
};

/* event handler */

/* exports */
/**
 * Creates a new player.
 * @param {socket.io-socket} socket        communication socket for the new player
 * @returns {module:server/player~Player}  newly created player
 */
exports.create = function(socket) {
	return new Player(socket);
};