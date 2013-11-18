/*
Dumb game controller for the snake.
*/

define(['../../lib/multi', '/socket.io/socket.io.js', '../joystick', '../sound', '../layout'], function (multiModule, socketio, Joystick, sound, layout) {

	var SESSION_TOKEN = 'snake-multiplayer';
	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/'
	};

	// init and try to connect
	var multi = multiModule.init(multiOptions);
	multi.joinSession(SESSION_TOKEN).then(onSession, onSessionFailed).done();


	// joined session successfully
	function onSession(session) {

		var joystick = new Joystick(30, onDirectionChange, $('#marker'));
		layout.showSection('#waiting');
		$('#waiting .start').click(onStartClick);

		session.myself.on('attributesChanged', onAttributesChanged);
		session.on('aboveMinPlayerNeeded', onAboveMinPlayerNeeded);
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		session.on('start', startGame);
		session.once('destroyed', onSessionDestroyed);

		if (session.getPlayerCount() >= session.minPlayerNeeded) {
			onAboveMinPlayerNeeded();
		}

		function onStartClick(event) {
			session.message('start');
		}

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

		function onAboveMinPlayerNeeded() {
			// enough players - allow to start the game
			$('#waiting .start').show();
		}

		function onBelowMinPlayerNeeded() {
			// not enough player - go into waiting mode
			joystick.stop();
			layout.showSection('#waiting');
			$('#waiting .start').hide();
		}

		function onAttributesChanged() {
			// TODO: doesn't reach me because of multi bug
			//var rgb = session.myself.attributes.color;
			//var colorStr = 'rgb('+rgb.r+','+rgb.g+','+rgb.b+')';
			//$('#controller h1').css('color', colorStr);
		}

		function onSessionDestroyed() {
			// something went wrong - my session does not longer exist
			sound.onDisconnect();
			layout.showError('Ooops. The connection dropped. Try to reload.');
		}
	}

	function onSessionFailed(error) {
		// joining the session failed
		if (error instanceof multiModule.SessionFullError) {
			layout.showError('This game has enough player already. Please try again later.');
		} else if (error instanceof multiModule.NoConnectionError) {
			layout.showError('There is no server connection. Please try again later.');
		} else if (error instanceof multiModule.NoSuchSessionError) {
			layout.showError('This game does not exist. Make sure your URL is correct.');
		} else {
			layout.showError('Something went terribly wrong. Please try again.');
		}
	}
});