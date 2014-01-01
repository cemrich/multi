requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

/*
Screen of the snake game that shows all the action.
This snake game allows one presenter and two to four controller.
*/

define(['../../lib/multi', './game', '../sound', '../layout', '../../SERVER'],
	function (multiModule, Game, sound, layout, SERVER) {

	var SESSION_TOKEN = 'snake-multiplayer';

	var multiOptions = {
		server: SERVER,
		session: {
			minPlayerNeeded: 3,
			maxPlayerAllowed: 5,
			token: {
				// static token because we only need a single session
				func: 'staticToken',
				args: [SESSION_TOKEN]
			}
		}
	};

	// init and try to create the session
	var multi = multiModule.init(multiOptions);
	multi.createSession().then(onSession, onSessionFailed).done();


	// created a session
	function onSession(session) {

		var game;
		showJoinUrl();

		// waiting for our players
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		session.on('playerJoined', onPlayerJoined);
		session.on('start', startGame);
		session.once('destroyed', onSessionDestroyed);


		function showJoinUrl() {
			// show url to join this session
			var url = window.location.host + '/snakemp';
			$('#waiting .controllerUrl').text(url);
			$('#waiting .controllerUrl').attr('href', 'http://' + url);
			layout.showSection('#waiting');
		}

		function startGame() {
			sound.onStartGame();
			game = new Game(session);
			game.on('stop', onGameFinished);
			game.start();
		}

		function onGameFinished() {
			// assuming the game is finished here
			// -> go back to waiting mode
			sound.onGameOver();
			session.message('finished', null, 'all-but-myself');
			layout.showSection('#waiting');
		}

		function onPlayerJoined(event) {
			sound.onConnect();
			var color = layout.colors[event.player.number-1];
			var p = $('<div class="player"></div>');
			p.css('background-color', color.hex);
			$('#waiting .players').append(p);
			event.player.on('disconnected', function () {
				sound.onDisconnect();
				p.remove();
			});
			event.player.attributes.color = color;
		}

		function onBelowMinPlayerNeeded() {
			// we don't have enough players any longer
			if (game) {
				game.removeListener('stop', onGameFinished);
				game.stop();
			}
			layout.showSection('#waiting');
		}

		function onSessionDestroyed() {
			// something went wrong - my session does not longer exist
			if (game) {
				game.removeListener('stop', onGameFinished);
				game.stop();
			}
			sound.onDisconnect();
			layout.showError('Ooops. The connection dropped. Try to reload.');
		}
	}

	// creating a session failed
	function onSessionFailed(error) {
		if (error instanceof multiModule.NoConnectionError) {
			layout.showError('There is no server connection. Please try again later.');
		} else if (error instanceof multiModule.TokenAlreadyExistsError) {
			layout.showError('The game has already been started in another window or tab.');
		} else {
			layout.showError('Something went terribly wrong. Please try again.');
		}
	}

});