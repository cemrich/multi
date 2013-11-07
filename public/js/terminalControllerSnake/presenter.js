/*
Screen of the snake game that shows all the action.
*/

define(function (require, exports, module) {

	exports.start = function (session, showSection) {

		function startGame() {
			showSection('#presenter-game');
			setTimeout(onGameFinished, 2000);
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

		function onPlayerJoined(event) {
			// the one and only player joined
			// we can start the game now
			// TODO: implement some mechanism that allows to specify the number of allowed player per session
			startGame();
		}

		// show url to join this session
		$('#presenter-waiting .controllerUrl').text(session.joinSessionUrl);
		$('#presenter-waiting .controllerUrl').attr('href', session.joinSessionUrl);
		showSection('#presenter-waiting');

		// waiting for our player
		session.once('playerJoined', onPlayerJoined);

	}

});