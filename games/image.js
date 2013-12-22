/* global exports */

var multiModule = require('../multi/server');


exports.Game = function (session) {

	function onPlayerJoined(event) {
		var player = event.player;
		player.attributes.color = multiModule.color.random();

		event.player.on('pos', function (event) {
			var global = player.screen.localToGlobal(event.data.x, event.data.y);
			session.message('pos', global, 'all', true);
		});
	}

	function onStartGame() {
		
	}

	var arranger = new multiModule.screens.HorizontalArranger(session);
	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);

};