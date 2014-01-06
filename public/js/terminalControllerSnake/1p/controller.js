/*
Dumb game controller for the snake.
*/

define(['../../lib/joystick', '../sound', '../layout'],
	function (Joystick, sound, layout) {

	function start(session) {

		var joystick = new Joystick(30, onDirectionChange, $('#marker'), $('html'));

		function onDirectionChange(direction) {
			$('#marker').attr('class', 'dir' + direction);
			sound.onJoystickDirectionChange();
			session.myself.attributes.direction = direction;
		}

		function startGame() {
			layout.showSection('#controller');
			session.once('finished', onFinished);
			joystick.start();
		}

		function onAgainClick(event) {
			// player wants to play again
			session.message('again');
			startGame();
		}

		function onExitClick(event) {
			// with one player bored the game is over
			window.close();
		}

		function onFinished() {
			// game is finished
			joystick.stop();
			layout.showSection('#finished');
			$('#finished .again').one('click', onAgainClick);
			$('#finished .exit').one('click', onExitClick);
		}

		function onBelowMinPlayerNeeded() {
			// we don't have enough players any longer
			// means our presenter has disconnected - quit
			session.myself.disconnect();
		}

		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		startGame();

	}

	return {
		start: start
	};
});