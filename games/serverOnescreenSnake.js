var multiModule = require('../multi/server');


exports.Game = function (session) {

	function onPlayerJoined(event) {
		// TODO: cannot send messages here
		event.player.attributes.color = multiModule.color.random();
	}

	function onStartGame() {
		setTimeout(function () {
			session.message('finished');
		}, 500);
	}

	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);

};