requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['./Screen', '../lib/multi', '../lib/joystick', '../lib/jquery-2.0.0.min'],
	function (Screen, multiModule, Joystick) {

	var screen = null;
	var session = null;
	var arranger = null;
	var joystick = null;

	var multiOptions = {
		server: 'tinelaptopsony',
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

		var setColor = function () {
			playerView.css('background-color', player.attributes.color);
		};

		setColor();
		$('.players').append(playerView);

		player.on('attributeChanged/color', setColor);
		player.on('draw', function (event) {
			var data = event.data;
			screen.drawPlayer(player, data.x, data.y, data.width, data.height);
		});
		player.on('disconnected', function () {
			playerView.remove();
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
		joystick = new Joystick(30, onDirectionChange, $('.joystick'), $('html'));
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