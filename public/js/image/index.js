requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['../lib/multi', '../SERVER'],
	function (multiModule, SERVER) {

	var multiOptions = {
		server: SERVER
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
		playerView[0].style.webkitBoxOrdinalGroup = player.number + 1;
		playerView[0].style.msFlexOrder = player.number;
		$('.players').append(playerView);

		player.getAttributeAsync('color').then(function (color) {
			playerView.css('background-color', color);
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

	function onStartGame(session) {
		var isMouseDown = false;
		var image = $('#image');
		var imageStyle = image[0].style;
		var screen = session.myself.screen;
		var currX = 0;
		var currY = 0;
		var offsetX = 0;
		var offsetY = 0;

		if (session.myself.number === 0) {
			moveStar(50, 50);
		}
		showSection('game');

		function moveStar(x, y) {
			currX = x;
			currY = y;
			imageStyle.transform = imageStyle.webkitTransform =
				'translate3d(' + x + 'px,' + y + 'px,0)';
		}

		session.on('pos', function (event) {
			var local = screen.globalToLocal(event.data.x, event.data.y);
			moveStar(local.x, local.y);
		});

		function onMovedLocally(x, y) {
			x -= offsetX;
			y -= offsetY;
			var global = screen.localToGlobal(x, y);
			session.message('pos', global, 'all-but-myself', true);
			moveStar(x, y);
		}
		image.on('mousedown', function (event) {
			offsetX = event.clientX - currX;
			offsetY = event.clientY - currY;
			isMouseDown = true;
			event.stopPropagation();
			event.preventDefault();
		});
		image.on('touchstart', function (event) {
			offsetX = event.originalEvent.touches[0].clientX - currX;
			offsetY = event.originalEvent.touches[0].clientY- currY;
			event.stopPropagation();
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
		$(window).on('mousedown touchstart', function(event) {
			offsetX = 142;
			offsetY = 142;
			isMouseDown = true;
		});
	}

	function onSession(s) {
		session = s;
		arranger = new multiModule.screens.HorizontalArranger(session);

		$('#status').text('connected');
		session.myself.attributes.color = multiModule.color.random();
		$('html').css('background-color', session.myself.attributes.color);

		var fullUrl = 'http://' + session.joinSessionUrl;
		$('.join-url').text(session.joinSessionUrl);
		$('.join-url').attr('href', fullUrl);
		$('#game .qr').qrcode({width: 150, height: 150, text: fullUrl});
		$('#game .qr').on('click touchstart', function () {
			$(this).hide();
		});
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
	multi.autoJoinOrCreateSession().then(onSession, onSessionFailed).done();

});