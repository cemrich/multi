requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['../lib/multi', '../lib/joystick', '../lib/jquery-2.0.0.min'],
	function (multiModule, Joystick) {

	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var joystick = null;

	var multiOptions = {
		server: '192.168.0.100',
		session: {
			scriptName: 'games/serverOnescreenSnake.js'
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

		player.on('attributesChanged', setColor);
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

	function onSession(session) {

		function onDraw(event) {
			var owner = session.getPlayerById(event.data.playerId);
			if (owner) {
				context.fillStyle = owner.attributes.color;
				context.fillRect(event.data.x-1, event.data.y-1, 3, 3);
			}
		}

		function onDirectionChange(direction) {
			session.myself.attributes.direction = direction;
		}
	
		joystick = new Joystick(30, onDirectionChange, $('.joystick'), $('html'));
		showSection('joined');
		$('#status').text('connected');
		$('.join-url').text(session.joinSessionUrl);
		$('.join-url').attr('href', 'http://' + session.joinSessionUrl);
		session.getPlayerArray().forEach(addPlayer);
		session.on('destroyed', onSessionDestroyed);
		session.on('playerJoined', function (event) {
			addPlayer(event.player);
		});
		$('button.start').click(function () {
			session.message('startGame');
		});
		session.on('startGame', onStartGame);
		session.myself.on('draw', onDraw);
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
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

});