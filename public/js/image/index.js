requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['../lib/multi',  '../lib/jquery-2.0.0.min'],
	function (multiModule) {

	var multiOptions = {
		server: '192.168.0.100',
		session: {
			scriptName: 'games/image.js'
		}
	};

	var session;

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
		player.on('disconnected', function () {
			playerView.remove();
		});
	}

	function onError(message) {
		showSection('error');
		$('#status').text('disconnected');
		$('#error').text(message);
	}

	function onStartGame(session) {
		var image = $('#image');

		if (session.myself.number === 0) {
			image.css('left', 0);
		}
		showSection('game');

		session.on('pos', function (event) {
			image.css('top', event.data.y);
			image.css('left', event.data.x);
		});

		function move(event) {
			session.myself.message('pos', {
					x: event.clientX-142,
					y: event.clientY-142
				}, 'server');
			event.preventDefault();
		}

		image.on('mousedown', function (event) {
			event.preventDefault();
		});
		$(window).on('mousemove', function (event) {
			if (event.which === 1) {
				move(event);
			}
		});
	}

	function onSession(session) {
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
		session.on('startGame', function () {
			onStartGame(session);
		});
	}

	function onSessionDestroyed() {
		onError('session has been destroyed');
	}

	function onSessionFailed(error) {
		onError(error.message);
	}


	var multi = multiModule.init(multiOptions);
	multi.autoJoinElseCreateSession().then(onSession, onSessionFailed).done();

});