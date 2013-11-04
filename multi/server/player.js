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
	/** 
	 * Object with user attributes for this player.
	 * All changes within this object will automatically
	 * be synced to the client side. Make sure not to 
	 * override the hole object but only its attributes.
	 * @type {object}
	 */
	this.attributes = { };

	EventDispatcher.call(this);
	WatchJS.watch(this.attributes, onAttributesChange, 0, true);

	/** 
	 * Called when the user attributes have been changed.
	 * @param {string} prop      property that has been changed
	 * @param {string} action    what has been done to the property
	 * @param          newvalue  new value of the changed property
	 * @param          oldvalue  old value of the changed property
	 */
	function onAttributesChange(prop, action, newvalue, oldvalue) {
		//console.log(prop+" - action: "+action+" - new: "+newvalue+", old: "+oldvalue);
		player.dispatchEvent('attributesChanged');
	}

	// socket disconnection
	this.socket.on('disconnect', function(event) {
		WatchJS.unwatch(player.attributes, onAttributesChange);
		player.dispatchEvent('disconnected');
	});

	// a client has changed player attributes
	this.socket.on('playerAttributesChanged', function(event) {
		if (event.id === player.id) {
			for (var i in event.attributes) {
				player.attributes[i] = event.attributes[i];
			}
		}
	});

	// the corresponding session sends us a message
	// this should be mirrored to the other session instances
	this.socket.on('message', function (event) {
		player.dispatchEvent('message', event);
	});
};

/* class methods */
util.inherits(Player, EventDispatcher);

/**
 * Prepares this player for sending it via socket message
 * while avoiding circular dependencies.
 * @return {object} packed player object (without socket)
 */
Player.prototype.pack = function () {
	return { 
		id: this.id,
		attributes: this.attributes
	};
};

/* exports */
/**
 * Creates a new player.
 * @param {socket.io-socket} socket        communication socket for the new player
 * @returns {module:server/player~Player}  newly created player
 */
exports.create = function(socket) {
	return new Player(socket);
};