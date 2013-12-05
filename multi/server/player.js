/* global exports */

/**
 * @module server/player
 * @private
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var SyncedObject = require('../shared/SyncedObject');


/**
 * @typedef {Object} PlayerParams
 * @property {integer} width   pixel width of this clients screen
 * @property {integer} height  pixel height of this clients screen
 * @private
 */
 
 
/**
 * @classdesc This player class represents a device connected
 * to a session. Every player will be mirrored to all connected
 * devices.
 *
 * @mixes external:EventEmitter
 * @fires module:server/player~Player#attributesChanged
 * @fires module:server/player~Player#disconnected
 * @class
 * @protected
 * @param {socket.io-socket} socket  communication socket for the new player
 * @param {module:server/player~PlayerParams} playerParams
 */
var Player = function (socket, messageBus, playerParams) {

	/**
	 * wrapper for this players attributes
	 * @type {SyncedObject}
	 * @private
	 */
	this.syncedAttributes = new SyncedObject();
	/** 
	 * communication socket for this player
	 * @type {socket.io-socket}
	 * @private
	 */
	this.socket = socket;
	this.messageBus = messageBus;
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
	 * @readonly
	 */
	this.role = 'player';
	/** 
	 * Object with user attributes for this player.
	 * All changes within this object will automatically
	 * be synced to all other clients. 
	 * Make sure not to override the hole object but only 
	 * its attributes. To change the whole object use 
	 * {@link module:server/player~Player#updateAttributes updateAttributes}.
	 * <br><br>
	 * Listen for changes by subscribing to the
	 * {@link module:server/player~Player#attributesChanged attributesChanged}
	 * event.
	 * @type {object}
	 */
	this.attributes = this.syncedAttributes.data;
	/**
	 * Unique player-number inside this session beginning with 0.
	 * Free numbers from disconnected players will be reused to
	 * avoid gaps.
	 * @type {integer}
	 * @readonly
	 */
	this.number = null;
	/**
	 * pixel width of this clients screen
	 * @type {integer}
	 * @readonly
	 */
	this.width = playerParams.width || 0;
	/**
	 * pixel height of this clients screen
	 * @type {integer}
	 * @readonly
	 */
	this.height = playerParams.height || 0;

	EventEmitter.call(this);

	// listeners
	this.onAttributesChanged = this.onAttributesChanged.bind(this);
	this.socket.on('disconnect', this.onDisconnect.bind(this));
	this.messageBus.register('playerMessage', this.onPlayerMessage.bind(this));
	this.syncedAttributes.on('changed', this.onAttributesChanged);
	this.syncedAttributes.startWatching();
};

/* class methods */
util.inherits(Player, EventEmitter);

/**
 * Any player send a player message. is it mine?
 * @private
 */
Player.prototype.onPlayerMessage = function (data) {
	if (data.id === this.id) {
		this.messageBus.send('playerMessage', { id: data.id, type: data.type, data: data.data });
		this.emit(data.type, { type: data.type, data: data.data });
	}
};

/**
 * Handle socket disconnection.
 * @private
 */
Player.prototype.onDisconnect = function () {
	this.emit('disconnected');
	// remove all listeners
	this.socket.removeAllListeners();
	this.removeAllListeners();
	this.syncedAttributes.stopWatching();
};

/** 
 * Called when the user attributes have been changed.
 * @param {SyncedObject.Changeset} changeset
 * @private
 */
Player.prototype.onAttributesChanged = function (changeset) {
	this.emit('attributesChanged', changeset);
};

/**
 * Overrides {@link module:server/player~Player#attributes attributes} 
 * with the given new attributes.
 * @param {object} attributesObject an object containing all 
 * new attributes
 * @fires module:server/player~Player#attributesChanged
 */
Player.prototype.updateAttributes = function (changeset) {
	this.syncedAttributes.applyChangeset(changeset);
};

/**
 * Sends the given message to all client instances of this player.
 * @example
 * // on any client
 * player.on('ping', function (event) {
 *   // outputs 'bar'
 *   console.log(event.data.foo);
 * });
 * // on server, instance of same player
 * player.message('ping', { foo: 'bar' });
 * @param {string} type    type of message that should be send
 * @param {object} [data]  message data that should be send
 */
Player.prototype.message = function (type, data) {
	this.messageBus.send('playerMessage',
		{ id: this.id, type: type, data: data }
	);
};

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
		attributes: this.attributes,
		width: this.width,
		height: this.height
	};
};


 /**
 * Fired when the {@link module:server/player~Player#attributes attributes} 
 * of this player have been changed by the server or any client.
 * The event is a {@link SyncedObject.Changeset} object.
 * @event module:server/player~Player#attributesChanged
 */

 /**
 * Fired when this player disconnects from the server. Don't use this
 * instance any longer after this event has been fired.
 * @event module:server/player~Player#disconnected
 */


/* exports */

/**
 * Compare function to sort an array of players by 
 * {@link module:server/player~Player#number player numbers}.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
 */
exports.compare = function (p1, p2) {
	return p1.number - p2.number;
};

/**
 * Creates a new player.
 * @param {socket.io-socket} socket        communication socket for the new player
 * @param {module:server/player~PlayerParams} playerParams
 * @returns {module:server/player~Player}  newly created player
 */
exports.create = function(socket, messageBus, playerParams) {
	return new Player(socket, messageBus, playerParams);
};