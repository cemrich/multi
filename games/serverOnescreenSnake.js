var multiModule = require('../multi/server');


exports.Game = function (session) {

	function onPlayerJoined(event) {
		// TODO: cannot send messages here
		event.player.attributes.color = multiModule.color.random();
	}

	function onStartGame() {
		console.log('--- onStartGame');
	}

	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);

};