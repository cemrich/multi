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
		var isMouseDown = false;
		var image = $('#image');
		var imageStyle = image[0].style;
		var screen = session.myself.screen;

		if (session.myself.number === 0) {
			imageStyle.transform = imageStyle.webkitTransform =
				'translate3d(50px,50px,0)';
		}
		showSection('game');

		function moveStar(x, y) {
			imageStyle.transform = imageStyle.webkitTransform =
				'translate3d(' + x + 'px,' + y + 'px,0)';
		}

		session.on('pos', function (event) {
			var local = screen.globalToLocal(event.data.x, event.data.y);
			moveStar(local.x, local.y);
		});

		function onMovedLocally(x, y) {
			var global = screen.localToGlobal(x-142, y-142);
			session.message('pos', global, 'all-but-myself', true);
			moveStar(x-142, y-142);
		}
		image.on('mousedown', function (event) {
			event.preventDefault();
		});
		$(window).on('mousemove', function (event) {
			if (isMouseDown) {
				var x = event.clientX;
				var y = event.clientY;
				onMovedLocally(x, y);
				event.preventDefault();
			}
		});
		$(window).on('touchmove', function (event) {
			var x = event.originalEvent.touches[0].clientX;
			var y = event.originalEvent.touches[0].clientY;
			onMovedLocally(x, y);
			event.preventDefault();
		});
		$(window).on('mouseup', function() {
			isMouseDown = false;
		});
		$(window).on('mousedown', function() {
			isMouseDown = true;
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