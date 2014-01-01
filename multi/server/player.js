/* global exports */

/**
 * @module server/player
 * @private
 */

var EventEmitter = require('events').EventEmitter;
var util = require('util');
var SyncedObject = require('../shared/SyncedObject');
var MessageSender = require('../shared/CustomMessageSender');


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
	/** 
	 * unique id for this player
	 * @type {string}
	 * @readonly
	 */
	this.id = socket.id;
	this.messageBus = messageBus;
	this.messageSender = new MessageSender(messageBus, this.id);
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
	this.disconnectToken = this.messageBus.register('disconnect',
		this.id, this.onDisconnect.bind(this));
	this.messageToken = this.messageBus.register('message',
		this.id, this.onPlayerMessage.bind(this));
	this.attributesChangedToken = this.messageBus.register('attributesChanged',
		this.id, this.onAttributesChangedOnClient.bind(this));
	this.syncedAttributes.on('changed', this.onAttributesChanged);
	this.syncedAttributes.startWatching();
};

/* class methods */
util.inherits(Player, EventEmitter);

/**
 * Any player send a player message. is it mine?
 * @private
 */
Player.prototype.onPlayerMessage = function (message) {
	this.emit(message.type, { type: message.type, data: message.data });
};

/**
 * Handle socket disconnection.
 * @private
 */
Player.prototype.onDisconnect = function () {
	this.messageBus.send({
		name: 'disconnected',
		fromInstance: this.id
	});
	this.messageBus.unregister(this.messageToken);
	this.messageBus.unregister(this.attributesChangedToken);
	this.messageBus.unregister(this.disconnectToken);
	this.emit('disconnected');
	// remove all listeners
	this.removeAllListeners();
	this.syncedAttributes.stopWatching();
};

/**
 * Some players attributes were changed on the client side. 
 * Apply the changes.
 * @private
 */
Player.prototype.onAttributesChangedOnClient = function (message) {
	this.updateAttributes(message.changeset);
};

/** 
 * Called when the user attributes have been changed.
 * @param {SyncedObject.Changeset} changeset
 * @private
 */
Player.prototype.onAttributesChanged = function (changeset) {
	this.messageBus.send({
		name: 'attributesChanged',
		fromInstance: this.id,
		changeset: changeset
	});
	if (changeset.hasOwnProperty('changed')) {
		for (var i in changeset.changed) {
			this.emit('attributeChanged/' + i, this.attributes[i]);
		}
	}
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
 * Get the value of a specific 
 * {@link module:server/player~Player#attributes attributes}
 * field. If the value is not present yet, it will be passed to the returned 
 * promise later on. This should make handling async code a bit easier.<br>
 * This method is especially useful for attributes that are set just once
 * right after the player joined a session but need a bit of time to sync to 
 * all clients, eg. player color, name, etc.
 * @param  {string} name       name of the attribute whose value you want to 
 *  know
 * @param  {integer} [timeout=1000] time in milliseconds after which the 
 *  returned promise will be rejected, if the attribute is not present
 * @return {external:Promise} On success the promise will be resolved with 
 * the value of the requested attribute. Has the attribute not been available 
 * after the given timout, the promise will be rejected with a generic
 * error.
 *
 * @example
 * session.on('playerJoined', function (event) {
 *   event.player.getAttributeAsync('foo').then(function (value) {
 *     console.log(value); // will be '#ff0000'
 *   });
 * });
 * 
 * // on any client:
 * player.attributes.color = '#ff0000';
 * 
 */
Player.prototype.getAttributeAsync = function (name, timeout) {
	return this.syncedAttributes.get(name, timeout);
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
 * @param {module:server/multi~toClient} [toClient='all']  which client
 *  should receive this message
 * @param {boolean} [volatile=false]  if true, the message may be dropped
 *  by the framework. Use this option for real time data where one dropped
 *  message does not interrupt your application.
 */
Player.prototype.message = function (type, data, toClient, volatile) {
	this.messageSender.message(type, data, toClient, volatile);
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
 * @event module:server/player~Player#attributesChanged
 * @property {*}      value  new value of the changed attribute
 *
 * @example
 * player.on('attributeChanged/score', function (score) {
 *   console.log(score);
 * });
 *
 * // on another client or server
 * player.attributes.score++;
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