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
		$('#waiting .exit').click(onExitClick);

		session.myself.on('attributesChanged', onAttributesChanged);
		session.on('aboveMinPlayerNeeded', onAboveMinPlayerNeeded);
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		session.on('playerLeft', onPlayerLeft);
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
			session.myself.on('dead', onDead);
			joystick.start();
		}

		function onPlayerLeft(event) {
			if (event.player.role === 'presenter') {
				// our presenter disconnected - no reason to resume
				session.disconnectMyself();
			}
		}

		function onFinished() {
			// game is finished for all - go into waiting mode again
			layout.showSection('#waiting');
		}

		function onExitClick(event) {
			// with one player bored the game is over
			window.close();
			session.disconnectMyself();
		}

		function onDead() {
			// I am dead - quit or wait
			joystick.stop();
			layout.showSection('#finished');
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
			// TODO: only execute when _color_ has changed
			var color = session.myself.attributes.color;
			$('#waiting h1').css('color', color.hex);
			$('#controller h1').css('color', color.hex);
			$('#finished h1').css('color', color.hex);
			$('#waiting button').css('background-color', color.hex);
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