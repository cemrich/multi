requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['./Screen', '../lib/multi', '../lib/joystick', '../SERVER', '../lib/jquery-2.0.0.min'],
	function (Screen, multiModule, Joystick, SERVER) {

	var screen = null;
	var session = null;
	var arranger = null;
	var joystick = null;

	var multiOptions = {
		server: SERVER,
		session: {
			scriptName: 'games/serverOnescreenSnake/index.js'
		}
	};

	function showSection(section) {
		$('.section').hide();
		$('#' + section).show();
	}

	function addPlayer(player) {
		var playerView = $('<div></div>');
		playerView.addClass('player');
		playerView.css('height', player.height/10);
		playerView.css('max-width', player.width/10);
		playerView[0].style.order = player.number;
		$('.players').append(playerView);

		player.getAttributeAsync('color').then(function (color) {
			playerView.css('background-color', color);
		});
		player.on('draw', function (event) {
			var data = event.data;
			screen.drawPlayer(player, data.x, data.y, data.width, data.height);
		});
		player.on('disconnected', function () {
			playerView.remove();
			screen.updateBorders();
		});
	}

	function onError(message) {
		showSection('error');
		$('#status').text('disconnected');
		$('#error').text(message);
	}

	function onStartGame() {
		showSection('game');
		joystick.start();
	}

	function onGameFinished() {
		showSection('joined');
		screen.clearPlayers();
		joystick.stop();
	}

	function onDied() {
		console.log('I am dead!');
	}

	function onSession(s) {
		session = s;

		function onDirectionChange(direction) {
			session.myself.attributes.direction = direction;
		}

		arranger = new multiModule.screens.HorizontalArranger(session);
		screen = new Screen(session, arranger);
		joystick = new Joystick(30, onDirectionChange, false, $('.joystick'), $('html'));
		screen.updateBorders();
		showSection('joined');
		$('#status').text('connected');
		$('.join-url').text(session.joinSessionUrl);
		$('.join-url').attr('href', 'http://' + session.joinSessionUrl);
		session.getPlayerArray().forEach(addPlayer);
		session.on('destroyed', onSessionDestroyed);
		session.on('playerLeft', function () {
			screen.updateBorders();
		});
		session.on('playerJoined', function (event) {
			addPlayer(event.player);
			screen.updateBorders();
		});
		$('button.start').click(function () {
			session.message('startGame');
		});
		session.myself.on('died', onDied);
		session.on('startGame', onStartGame);
		session.on('finished', onGameFinished);
	}

	function onSessionDestroyed() {
		onError('session has been destroyed');
		if (joystick !== null) {
			joystick.stop();
		}
	}

	function onSessionFailed(error) {
		onError(error.message);
	}


	var multi = multiModule.init(multiOptions);
	multi.autoJoinElseCreateSession().then(onSession, onSessionFailed).done();

});