/* global exports */

var multiModule = require('../multi/server');
var ScreenArranger = require('../multi/shared/screen').ScreenArranger;


exports.Game = function (session) {

	function onPlayerJoined(event) {
		var player = event.player;
		player.attributes.color = multiModule.color.random();
		event.player.on('pos', function (event) {
			var global = arranger.localToGlobal(player, event.data.x, event.data.y);
			var locals = arranger.globalRectToLocals(global.x, global.y, 283, 283);

			for (var i in locals) {
				var local = locals[i];
				session.message('pos', {x: local.x, y: local.y}, local.player, true);
			}
		});
	}

	function onStartGame() {
		
	}

	var arranger = new ScreenArranger(session);
	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);

};