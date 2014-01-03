/**
 * @module client/player
 * @private
 */
 
define(function(require, exports, module) {

	var AbstractPlayer = require('../shared/player').Player;
	var util = require('util');

	/**
	 * @classdesc Client side representation of a player object.
	 * @mixes module:shared/player~Player
	 * @inner
	 * @class
	 * @private
	 * @memberof module:client/player
	 * @param {string} id  unique identifier of this player
	 * @param {module:client/messages~MessageBus} messageBus  message bus 
	 *  instance this player should use to communicate
	*/
	var Player = function (id, messageBus) {

		AbstractPlayer.call(this, id, messageBus);

	};

	util.inherits(Player, AbstractPlayer);


	/* override */

	Player.prototype.onAttributesChangedRemotely = function (message) {
		this.syncedAttributes.applyChangesetSilently(message.changeset);
		this.emitAttributeChanges(message.changeset);
	};


	/* exports */

	/**
	 * Compare function to sort an array of players by 
	 * {@link module:client/player~Player#number player numbers}.
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
	 */
	exports.compare = function (p1, p2) {
		return p1.number - p2.number;
	};

	/**
	* Deserializes a player object send over a socket connection.
	* @returns {module:client/player~Player}
	*/
	exports.deserialize = function (data, messageBus) {
		var player = new Player(data.id, messageBus);
		for (var i in data) {
			player[i] = data[i];
		}
		return player;
	};

	return exports;

});