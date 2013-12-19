/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


define(function(require, exports, module) {

	var util = require('util');
	var ScreenArranger = require('./index').ScreenArranger;


	var HorizontalArranger = function (session) {
		ScreenArranger.call(this, session);
	};
	util.inherits(HorizontalArranger, ScreenArranger);

	HorizontalArranger.prototype.refresh = function () {
		var height = 0;
		var xPos = 0;
		var yPos;
		var lastPlayer = null;
		var players = this.session.getPlayerArray();
		players.forEach(function (player) {
			height = Math.max(height, player.height);
		});
		players.forEach(function (player) {
			yPos = Math.round((height - player.height) / 2);
			player.screen.x = xPos;
			player.screen.y = yPos;
			if (lastPlayer !== null) {
				player.screen.leftPlayers = [ lastPlayer ];
				lastPlayer.screen.rightPlayers = [ player ];
			}
			xPos += player.width;
			lastPlayer = player;
		});

		this.width = xPos;
		this.height = height;
	};

	exports = HorizontalArranger;
	return exports;

});