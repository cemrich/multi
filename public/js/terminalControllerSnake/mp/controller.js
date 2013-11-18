/*
Dumb game controller for the snake.
*/

define(['../joystick', '../sound'], function (Joystick, sound) {

	function start(session, showSection) {

		var joystick = new Joystick(30, onDirectionChange, $('#marker'));

		function onDirectionChange(direction) {
			$('#marker').attr('class', 'dir' + direction);
			sound.onJoystickDirectionChange();
			session.myself.attributes.direction = direction;
		}

		function startGame() {
			showSection('#controller');
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
			showSection('#finished');
			$('#finished .again').one('click', onAgainClick);
			$('#finished .exit').one('click', onExitClick);
		}

		function onBelowMinPlayerNeeded() {
			// we don't have enough players any longer
			// means our presenter has disconnected - quit
			// TODO: nicer syntax like session.myself.disconnect()
			session.disconnectMyself();
		}

		function onAttributesChanged() {
			// TODO: doesn't reach me because of multi bug
			var rgb = session.myself.attributes.color;
			var colorStr = 'rgb('+rgb.r+','+rgb.g+','+rgb.b+')';
			$('#controller h1').css('color', colorStr);
		}

		console.log(session.myself.attributes.color);
		session.myself.on('attributesChanged', onAttributesChanged);
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		startGame();

	}

	return {
		start: start
	};
});