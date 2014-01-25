/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


/**
 * @module shared/player
 * @private
 */
define(function(require, exports, module) {
	'use strict';

	var SyncedObject = require('./SyncedObject');
	var MessageSender = require('./CustomMessageSender');
	var EventEmitter = require('events').EventEmitter;
	var util = require('util');

	/**
	 * @classdesc This player class represents a device connected
	 * to a session. Every player will be mirrored to the server and
	 * all connected devices. This class can be used the same way on
	 * server and client side.
	 *
	 * @mixes external:EventEmitter
	 * @fires module:shared/player~Player#attributesChanged
	 * @fires module:shared/player~Player#disconnected
	 * @memberof module:shared/player
	 * @class
	 * @inner
	 * @protected
	 *
	 * @param {string} id  unique identifier of this player
	 * @param {module:client/messages~MessageBus|module:server/messages~MessageBus} 
	 *  messageBus  message bus instance this player should use to communicate
	 */
	var Player = function (id, messageBus) {

		EventEmitter.call(this);

		// PUBLIC

		/** 
		 * unique id for this player
		 * @type {string}
		 * @readonly
		 */
		this.id = id;
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


		// PROTECTED

		this.messageBus = messageBus;
		this.messageSender = new MessageSender(messageBus, id);
		/**
		 * wrapper for this players attributes
		 * @type {SyncedObject}
		 * @private
		 */
		this.syncedAttributes = new SyncedObject();


		// LISTENERS
	
		this.messageToken = this.messageBus.register('message',
			this.id, this.onMessage.bind(this));

		this.attributesChangedToken = this.messageBus.register('attributesChanged',
			this.id, this.onAttributesChangedRemotely.bind(this));

		this.disconnectToken = this.messageBus.register('disconnect',
			this.id, this.onDisconnect.bind(this));

		this.userDisconnectToken = this.messageBus.register('user-disconnect',
			this.id, this.onUserDisconnect.bind(this));

		this.syncedAttributes.on('changed', this.onAttributesChangedLocally.bind(this));
		this.syncedAttributes.startWatching();
	};

	util.inherits(Player, EventEmitter);

	/** 
	 * Object with user attributes for this player.
	 * All changes within this object will automatically
	 * be synced to all other clients.<br>
	 * Listen for changes by subscribing to the
	 * {@link module:shared/player~Player#event:attributesChanged attributesChanged}
	 * event.
	 * @type {object}
	 * @name attributes
	 * @memberOf module:shared/player~Player
	 * @instance
	 */
	Object.defineProperty(Player.prototype, 'attributes', {
		get: function() {
			return this.syncedAttributes.data;
		},
		set: function(val) {
			this.syncedAttributes.data = val;
		}
	});

	/** 
	 * Called when the user attributes have been changed locally.
	 * @param {SyncedObject.Changeset} changeset
	 * @private
	 */
	Player.prototype.onAttributesChangedLocally = function (changeset) {
		this.messageBus.send({
			name: 'attributesChanged',
			fromInstance: this.id,
			changeset: changeset
		});
	};

	/**
	 * Some players attributes were changed remotely. 
	 * Apply the changes.
	 * @abstract
	 * @private
	 */
	Player.prototype.onAttributesChangedRemotely = function (message) { };

	/**
	 * Called when this socket receives a message for any player.
	 * @private
	 */
	Player.prototype.onMessage = function (message) {
		this.emit(message.type, { type: message.type, data: message.data } );
	};

	/**
	 * Handles disconnection by removing listeners, stopping attribute
	 * syncing and emitting a disconnected event.
	 * @private
	 */
	Player.prototype.onDisconnect = function () {
		// I do not longer exist - inform...
		this.emit('disconnected');
		// ... and remove listeners
		this.removeAllListeners();
		this.messageBus.unregister(this.messageToken);
		this.messageBus.unregister(this.attributesChangedToken);
		this.messageBus.unregister(this.userDisconnectToken);
		this.messageBus.unregister(this.disconnectToken);
		this.syncedAttributes.removeAllListeners();
		this.syncedAttributes.stopWatching();
	};

	/**
	 * Gets called when this player has been disconnected by the user
	 * on any client or the server.
	 * @private
	 * @abstract
	 */
	Player.prototype.onUserDisconnect = function (message) {};

	/**
	 * Notifies the user about every change inside the given changeset.
	 * @param  {SyncedObject.Changeset} changeset
	 * @private
	 */
	Player.prototype.emitAttributeChanges = function (changeset) {
		if (changeset.hasOwnProperty('changed')) {
			for (var i in changeset.changed) {
				this.emit('attributeChanged/' + i, this.attributes[i]);
			}
		}
	};

	/**
	 * Get the value of a specific 
	 * {@link module:shared/player~Player#attributes attributes}
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
	 * @param {module:server/multi~toClient|module:client/multi~toClient} 
	 *  [toClient='all']  which client should receive this message
	 * @param {boolean} [volatile=false]  if true, the message may be dropped
	 *  by the framework. Use this option for real time data where one dropped
	 *  message does not interrupt your application.
	 */
	Player.prototype.message = function (type, data, toClient, volatile) {
		this.messageSender.message(type, data, toClient, volatile);
	};

	/**
	 * Disconnect the client represented by this player from the framework.
	 * Due to security reasons this will only work with the player that
	 * represents this client (session.myself) and fail silently on all others.
	 * @fires module:shared/player~Player#disconnected
	 */
	Player.prototype.disconnect = function () {
		this.messageBus.send({
			name: 'user-disconnect',
			fromInstance: this.id
		});
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
	 * Prepares this player for sending it via socket message
	 * while avoiding circular dependencies.
	 * @return {object} serialized player object (without socket)
	 */
	Player.prototype.serialize = function () {
		return {
			id: this.id,
			number: this.number,
			attributes: this.attributes,
			width: this.width,
			height: this.height
		};
	};
	
	/**
	 * Fired when the {@link module:shared/player~Player#attributes attributes} 
	 * of this player have been changed by any client or the server.
	 * @event module:shared/player~Player#attributesChanged
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
	 * @event module:shared/player~Player#disconnected
	 */


	/**
	 * Compare function to sort an array of players by 
	 * {@link module:shared/player~Player#number player numbers}.
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	 */
	exports.compare = function (p1, p2) {
		return p1.number - p2.number;
	};

	exports.Player = Player;
	return exports;

});