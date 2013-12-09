/**
 * @module client/player
 * @private
 */
 
define(function(require, exports, module) {

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var SyncedObject = require('../shared/SyncedObject');

	/**
	* @classdesc This player class represents a device connected
	* to a session. Every player is mirrored from its original instance 
	* on the server side.
	* 
	* @inner
	* @class
	* @protected
	* @mixes module:client/events.EventEmitter
	* @memberof module:client/player
	* @fires module:client/player~Player#attributesChanged
	* @fires module:client/player~Player#disconnected
	*
	* @param messageBus ........
	*/
	var Player = function (id, messageBus) {

		EventEmitter.call(this);

		/**
		 * wrapper for this players attributes
		 * @type {SyncedObject}
		 * @private
		 */
		this.syncedAttributes = new SyncedObject();

		this.messageBus = messageBus;
		/** 
		 * unique id for this player
		 * @type {string}
		 * @readonly
		 */
		this.id = id;
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
		 * be synced to the server side and all other clients. 
		 * Make sure not to override the hole object but only 
		 * its attributes.
		 * <br>
		 * Listen for changes by subscribing to the
		 * {@link module:client/player~Player#attributesChanged attributesChanged}
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
		this.width = null;
		/**
		 * pixel height of this clients screen
		 * @type {integer}
		 * @readonly
		 */
		this.height = null;

		// listeners
		this.messageRegister = this.messageBus.register('message',
			this.id, this.onPlayerMessage.bind(this));
		this.attributeRegister = this.messageBus.register('attributesChanged',
			this.id, this.onAttributesChangedOnServer.bind(this));
		this.leftRegister = this.messageBus.register('disconnected',
			this.id, this.onDisconnected.bind(this));
		this.syncedAttributes.on('changed', this.onAttributesChanged.bind(this));
		this.syncedAttributes.startWatching();
	};

	util.inherits(Player, EventEmitter);

	/**
	 * Called when any player left its session.
	 * @private
	 */
	Player.prototype.onDisconnected = function (message) {
		// I do not longer exist - inform...
		this.emit('disconnected');
		// ... and remove listeners
		this.removeAllListeners();
		this.messageBus.unregister(this.messageRegister);
		this.messageBus.unregister(this.attributeRegister);
		this.messageBus.unregister(this.leftRegister);
		this.syncedAttributes.stopWatching();
	};

	/**
	 * Called when this socket receives a message for any player.
	 * @private
	 */
	Player.prototype.onPlayerMessage = function (message) {
		this.emit(message.type, { type: message.type, data: message.data } );
	};

	/**
	 * Called when attributes for any player have been changed
	 * on server side.
	 * @private
	 */
	Player.prototype.onAttributesChangedOnServer = function (message) {
		this.syncedAttributes.applyChangesetSilently(message.changeset);
		if (message.changeset.hasOwnProperty('changed')) {
			for (var i in message.changeset.changed) {
				this.emit('attributesChanged', { key: i, value: this.attributes[i]});
			}
		}
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
	};

	/**
	* Sends the given message to all other instances of this player.
	* @example
	* // on client no 1
	* player.on('ping', function (event) {
	*   // outputs 'bar'
	*   console.log(event.data.foo);
	* });
	* // on client no 2, instance of same player
	* player.message('ping', { foo: 'bar' });
	* @param {string} type    type of message that should be send
	* @param {object} [data]  message data that should be send
	*/
	Player.prototype.message = function (type, data, toClient) {
		var message = {
			name: 'message',
			fromInstance: this.id,
			type: type,
			data: data
		};
		message.toClient = toClient || 'all';
		if (typeof message.toClient === 'object' &&
			message.toClient instanceof Player) {
			message.toClient = [ message.toClient.id ];
		}
		this.messageBus.send(message);
	};


	/**
	 * Fired when the {@link module:client/player~Player#attributes attributes} of 
	 * this player have been changed by this client, another client or 
	 * the server.
	 * @event module:client/player~Player#attributesChanged
	 * @property {string} key    name of the changed attribute
	 * @property {*}      value  new value of the changed attribute
	 * @todo this is currently dispatched only when changed from outside
	 */

	/**
	 * Fired when this player disconnects from the server. Don't use this
	 * instance any longer after this event has been fired.
	 * @event module:client/player~Player#disconnected
	 */


	/**
	 * Compare function to sort an array of players by 
	 * {@link module:client/player~Player#number player numbers}.
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	 */
	exports.compare = function (p1, p2) {
		return p1.number - p2.number;
	};

	/**
	* Unpacks a player object send over a socket connection.
	* @returns {module:client/player~Player}
	*/
	exports.fromPackedData = function (data, messageBus) {
		var player = new Player(data.id, messageBus);
		for (var i in data) {
			if (i === 'attributes') {
				for (var j in data[i]) {
					player.attributes[j] = data[i][j];
				}
			} else {
				player[i] = data[i];
			}
		}
		return player;
	};

	return exports;

});