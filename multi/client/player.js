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
	var Player = function (messageBus) {

		EventEmitter.call(this);

		/**
		 * wrapper for this players attributes
		 * @type {SyncedObject}
		 * @private
		 */
		this.syncedAttributes = new SyncedObject();

		this.bus = messageBus;
		/** 
		 * unique id for this player
		 * @type {string}
		 * @readonly
		 */
		this.id = null;
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
		this.onPlayerMessage = this.onPlayerMessage.bind(this);
		this.onPlayerAttributesChanged = this.onPlayerAttributesChanged.bind(this);
		this.onPlayerLeft = this.onPlayerLeft.bind(this);
		this.onAttributesChanged = this.onAttributesChanged.bind(this);

		this.bus.register('playerMessage', this.onPlayerMessage);
		this.bus.register('playerAttributesChanged', this.onPlayerAttributesChanged);
		this.bus.register('playerLeft', this.onPlayerLeft);
		this.syncedAttributes.on('changed', this.onAttributesChanged);
		this.syncedAttributes.startWatching();
	};

	util.inherits(Player, EventEmitter);

	/**
	 * Called when any player left its session.
	 * @private
	 */
	Player.prototype.onPlayerLeft = function (data) {
		if (data.playerId === this.id) {
			// I do not longer exist - inform...
			this.emit('disconnected');
			// ... and remove listeners
			this.removeAllListeners();
			this.bus.unregister('playerMessage', this.onPlayerMessage);
			this.bus.unregister('playerAttributesChanged', this.onPlayerAttributesChanged);
			this.bus.unregister('playerLeft', this.onPlayerLeft);
			this.syncedAttributes.stopWatching();
		}
	};

	/**
	 * Called when this socket receives a message for any player.
	 * @private
	 */
	Player.prototype.onPlayerMessage = function (data) {
		if (data.id === this.id) {
			this.emit(data.type, { type: data.type, data: data.data } );
		}
	};

	/**
	 * Called when attributes for any player have been changed
	 * on server side.
	 * @private
	 */
	Player.prototype.onPlayerAttributesChanged = function (data) {
		if (data.id === this.id) {
			this.syncedAttributes.applyChangesetSilently(data.changeset);
			if (data.changeset.hasOwnProperty('changed')) {
				for (var i in data.changeset.changed) {
					this.emit('attributesChanged', { key: i, value: this.attributes[i]});
				}
			}
		}
	};

	/** 
	 * Called when the user attributes have been changed.
	 * @param {SyncedObject.Changeset} changeset
	 * @private
	 */
	Player.prototype.onAttributesChanged = function (changeset) {
		this.bus.sendToServer('playerAttributesChanged',
			{ id: this.id, changeset: changeset },
			this.id
		);
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
	Player.prototype.message = function (type, data) {
		this.bus.send('playerMessage',
			{ id: this.id, type: type, data: data }
		);
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
		var player = new Player(messageBus);
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