var multiModule = require('../multi/server');


exports.Game = function (session) {

	function onPlayerJoined(event) {
		// TODO: cannot send messages here
		event.player.attributes.color = multiModule.color.random();
	}

	session.on('playerJoined', onPlayerJoined);

};