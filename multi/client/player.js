/**
 * @module client/player
 * @private
 */
 
define(function(require, exports, module) {

	var EventEmitter = require('events').EventEmitter;
	var util = require('util');
	var SyncedObject = require('../shared/SyncedObject');
	var MessageSender = require('../shared/CustomMessageSender');

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

		this.messageSender = new MessageSender(messageBus, id);
		/** 
		 * unique id for this player
		 * @type {string}
		 * @readonly
		 */
		this.id = id;
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
				this.emit('attributeChanged/' + i, this.attributes[i]);
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
	 * Get the value of a specific 
	 * {@link module:client/player~Player#attributes attributes}
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
	 * // on another client:
	 * player.attributes.color = '#ff0000';
	 * 
	 */
	Player.prototype.getAttributeAsync = function (name, timeout) {
		return this.syncedAttributes.get(name, timeout);
	};

	/**
	 * Sends the given message to all other instances of this player.
	 * @param {string} type    type of message that should be send
	 * @param {object} [data]  message data that should be send	
	 * @param {module:client/multi~toClient} [toClient='all']   which client
	 *  should receive this message
	 * @param {boolean} [volatile=false]  if true, the message may be dropped
	 *  by the framework. Use this option for real time data where one dropped
	 *  message does not interrupt your application.
	 * @example
	 * // on client no 1
	 * player.on('ping', function (event) {
	 *   // outputs 'bar'
	 *   console.log(event.data.foo);
	 * });
	 * // on client no 2, instance of same player
	 * player.message('ping', { foo: 'bar' });
	 */
	Player.prototype.message = function (type, data, toClient, volatile) {
		this.messageSender.message(type, data, toClient, volatile);
	};

	/**
	 * Determines if this player is the first one inside its session (has player
	 * number 0). Use this method to find out if this player has opened the 
	 * session or has joined later on.
	 * @return {boolean} true if the player number is 0, false otherwise
	 */
	Player.prototype.isFirst = function () {
		return this.number === 0;
	};
	

	/**
	 * Fired when the {@link module:client/player~Player#attributes attributes} of 
	 * this player have been changed by this client, another client or 
	 * the server.
	 * @event module:client/player~Player#attributesChanged
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