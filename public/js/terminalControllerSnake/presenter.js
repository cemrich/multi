/*
Screen of the snake game that shows all the action.
*/

define(['./game'], function (Game) {

	function start(session, showSection) {

		var game;

		function startGame() {
			game = new Game(session, showSection);
			game.on('stop', onGameFinished);
			game.start();
		}

		function onAgain() {
			// player wants to play again
			startGame();
		}

		function onGameFinished() {
			// assuming the game is finished here
			showSection('#presenter-finished');
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
			game.off('stop', onGameFinished);
			game.stop();
			showSection('#presenter-waiting');
		}

		// show url to join this session
		var url = window.location.host + '/snake';
		$('#presenter-waiting .controllerUrl').text(url);
		$('#presenter-waiting .controllerUrl').attr('href', 'http://' + url);
		showSection('#presenter-waiting');

		// waiting for our player
		session.on('aboveMinPlayerNeeded', onAboveMinPlayerNeeded);
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
	}

	return {
		start: start
	};

});