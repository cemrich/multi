/* global exports */

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
 * @param {socket.io-socket} socket  communication socket for the new player
 * @param {module:server/messages~MessageBus} messageBus  message bus instance 
 *  this player should use to communicate
 * @param {module:server/player~PlayerParams} playerParams
 */
var Player = function (socket, messageBus, playerParams) {

	AbstractPlayer.call(this, socket.id, messageBus);
	/** 
	 * communication socket for this player
	 * @type {socket.io-socket}
	 * @private
	 */
	this.socket = socket;
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

Player.prototype.onAttributesChangedRemotely = function (message) {
	this.syncedAttributes.applyChangeset(message.changeset);
};

Player.prototype.onAttributesChangedLocally = function (changeset) {
	AbstractPlayer.prototype.onAttributesChangedLocally.call(this, changeset);
	this.emitAttributeChanges(changeset);
};


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