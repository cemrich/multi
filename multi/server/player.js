/* global exports */

/**
 * @module server/player
 */

var util = require('util');
var WatchJS = require('../debs/watch');
var EventDispatcher = require('../shared/eventDispatcher');

/**
 * @classdesc This player class represents a device connected
 * to a session. Every player will be mirrored to all connected
 * devices.
 *
 * @mixes EventDispatcher
 * @fires module:server/player~Player#attributesChanged
 * @fires module:server/player~Player#disconnected
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
	 * @type {string}
	 * @readonly
	 */
	this.id = socket.id;
	/**
	 * Role that is fulfilled by this
	 * player. Either 'presenter' or 'player'.
	 * @type {string}
	 */
	this.role = 'player';
	/** 
	 * Object with user attributes for this player.
	 * All changes within this object will automatically
	 * be synced to all other clients. 
	 * Make sure not to override the hole object but only 
	 * its attributes.
	 * <br>
	 * Listen for changes by subscribing to the
	 * {@link module:server/player~Player#attributesChanged attributesChanged}
	 * event.
	 * @type {object}
	 */
	this.attributes = { };
	/**
	 * Unique player-number inside this session beginning with 0.
	 * Free numbers from disconnected players will be reused to
	 * avoid gaps.
	 * @type {integer}
	 */
	this.number = null;

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

	// is it my player message?
	this.socket.on('playerMessage', function (data) {
		if (data.id === player.id) {
			player.dispatchEvent(data.type, { type: data.type, data: data.data });
		}
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
		role: this.role,
		number: this.number,
		attributes: this.attributes
	};
};


 /**
 * Fired when the {@link module:server/player~Player#attributes attributes} 
 * of this player have been changed by the server or any client.
 * @event module:server/player~Player#attributesChanged
 */

 /**
 * Fired when this player disconnects from the server. Don't use this
 * instance any longer after this event has been fired.
 * @event module:server/player~Player#disconnected
 */


/* exports */
/**
 * Creates a new player.
 * @param {socket.io-socket} socket        communication socket for the new player
 * @returns {module:server/player~Player}  newly created player
 */
exports.create = function(socket) {
	return new Player(socket);
};