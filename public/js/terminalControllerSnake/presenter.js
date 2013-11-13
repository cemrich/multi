/*
Screen of the snake game that shows all the action.
*/

define(['./game', './sound'], function (Game, sound) {

	function start(session, showSection) {

		var game;

		function startGame() {
			game = new Game(session, showSection);
			game.on('stop', onGameFinished);
			game.start();
		}

		function onAgain() {
			// player wants to play again
			sound.onStartGame();
			startGame();
		}

		function onGameFinished() {
			// assuming the game is finished here
			sound.onGameOver();
			showSection('#finished');
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
			showSection('#waiting');
		}

		// show url to join this session
		var url = window.location.host + '/snake';
		$('#waiting .controllerUrl').text(url);
		$('#waiting .controllerUrl').attr('href', 'http://' + url);
		showSection('#waiting');

		// waiting for our player
		session.on('aboveMinPlayerNeeded', onAboveMinPlayerNeeded);
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
	}

	return {
		start: start
	};

});