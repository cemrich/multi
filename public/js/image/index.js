requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['../lib/multi',  '../lib/jquery-2.0.0.min'],
	function (multiModule) {

	var multiOptions = {
		server: 'localhost'
	};

	var session;
	var arranger;

	function showSection(section) {
		$('.section').hide();
		$('#' + section).show();
	}

	function addPlayer(player) {
		var playerView = $('<div></div>');
		playerView.addClass('player');
		playerView[0].style.order = player.number;

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
		var imageStyle = image[0].style;
		var screen = session.myself.screen;

		if (session.myself.number === 0) {
			imageStyle.webkitTransform = 'translate3d(50px,50px,0)';
		}
		showSection('game');

		function moveStar(x, y) {
			imageStyle.webkitTransform = 'translate3d(' + x + 'px,' + y + 'px,0)';
		}

		session.on('pos', function (event) {
			var local = screen.globalToLocal(event.data.x, event.data.y);
			moveStar(local.x, local.y);
		});

		function onMouseMove(event) {
			var x = event.clientX-142;
			var y = event.clientY-142;
			var global = screen.localToGlobal(x, y);
			session.message('pos', global, 'all-but-myself', true);
			moveStar(x, y);
			event.preventDefault();
		}

		image.on('mousedown', function (event) {
			event.preventDefault();
		});
		$(window).on('mousemove', function (event) {
			if (event.which === 1) {
				onMouseMove(event);
			}
		});
	}

	function onSession(s) {
		session = s;
		arranger = new multiModule.screens.HorizontalArranger(session);

		$('#status').text('connected');
		session.myself.attributes.color = multiModule.color.random();
		$('html').css('background-color', session.myself.attributes.color);

		$('.join-url').text(session.joinSessionUrl);
		$('.join-url').attr('href', 'http://' + session.joinSessionUrl);
		session.getPlayerArray().forEach(addPlayer);
		session.on('destroyed', onSessionDestroyed);
		session.on('playerJoined', function (event) {
			addPlayer(event.player);
		});
		onStartGame(session);
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