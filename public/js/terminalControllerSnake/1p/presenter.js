/*
Screen of the snake game that shows all the action.
*/

define(['./game', '../sound', '../layout'], function (Game, sound, layout) {

	function start(session) {

		var game;

		function startGame() {
			sound.onStartGame();
			game = new Game(session);
			game.on('stop', onGameFinished);
			game.start();
		}

		function onAgain() {
			// player wants to play again
			startGame();
		}

		function onGameFinished() {
			// assuming the game is finished here
			sound.onGameOver();
			layout.showSection('#finished');
			// TODO: refactor session message to get leaner code
			// and use broadcast OR emit
			session.message('finished');
			session.once('again', onAgain);
		}

		function onAboveMinPlayerNeeded() {
			// we have all players we need and can start the game now
			startGame();
		}

		function onBelowMinPlayerNeeded() {
			// we don't have enough players any longer
			sound.onDisconnect();
			game.off('stop', onGameFinished);
			game.stop();
			layout.showSection('#waiting');
		}

		// show url to join this session
		var url = window.location.host + '/snake1p';
		$('#waiting .controllerUrl').text(url);
		$('#waiting .controllerUrl').attr('href', 'http://' + url);
		layout.showSection('#waiting');

		// waiting for our player
		session.on('aboveMinPlayerNeeded', onAboveMinPlayerNeeded);
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
	}

	return {
		start: start
	};

});