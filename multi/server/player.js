/* jshint globalstrict: true */
/* global exports */
'use strict';

/**
 * @module server/player
 * @private
 */

var AbstractPlayer = require('../shared/player').Player;
var util = require('util');


/**
 * @typedef {Object} PlayerParams
 * @property {integer} width   pixel width of this clients screen
 * @property {integer} height  pixel height of this clients screen
 * @private
 */
 
 
/**
 * @classdesc Server side representation of a player object.
 * @mixes module:shared/player~Player
 * @class
 * @private
 * @param {string} id  unique identifier of this player
 * @param {module:server/messages~MessageBus} messageBus  message bus instance 
 *  this player should use to communicate
 * @param {module:server/player~PlayerParams} playerParams
 */
var Player = function (id, messageBus, playerParams) {

	AbstractPlayer.call(this, id, messageBus);

	this.width = playerParams.width || 0;
	this.height = playerParams.height || 0;

};

util.inherits(Player, AbstractPlayer);


/* override */

Player.prototype.onDisconnect = function () {
	this.messageBus.send({
		name: 'disconnect',
		fromInstance: this.id
	});
	AbstractPlayer.prototype.onDisconnect.call(this);
};

Player.prototype.onUserDisconnect = function (message) {
	// only allow disconnects from own client
	if (message.fromClient === this.id) {
		this.messageBus.disconnect(this.id);
	}
};

Player.prototype.onAttributesChangedRemotely = function (message) {
	this.syncedAttributes.applyChangeset(message.changeset);
};

Player.prototype.onAttributesChangedLocally = function (changeset) {
	AbstractPlayer.prototype.onAttributesChangedLocally.call(this, changeset);
	this.emitAttributeChanges(changeset);
};


/* exports */

/**
 * Creates a new player.
 * @param {string} id  unique identifier of this player
 * @param {module:server/messages~MessageBus} messageBus  message bus instance 
 *  this player should use to communicate
 * @param {module:server/player~PlayerParams} playerParams
 * @returns {module:server/player~Player}  newly created player
 */
exports.create = function(id, messageBus, playerParams) {
	return new Player(id, messageBus, playerParams);
};