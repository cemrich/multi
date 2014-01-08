requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['../lib/multi', './Game', '../SERVER', '../lib/jquery-2.0.0.min'],
	function (multiModule, Game, SERVER) {

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

	function onError(message) {
		showSection('error');
		$('#status').text('disconnected');
		$('#error').text(message);
	}

	function onSession(session) {
		var url = window.location.host;
		if (window.location.port !== '' && window.location.port !== '80') {
			url += ':' + window.location.port;
		}
		url += window.location.pathname;

		$('#status').text('connected');
		$('.join-url').text(url);
		$('.join-url').attr('href', 'http://' + url);
		$('#joined .code').text(session.token);

		var game = new Game(session, onError, showSection);
		session.on('destroyed', function () {
			game.stop();
		});
	}

	function onCreateSessionFailed(error) {
		onError(error.message);
	}

	function onJoinSessionFailed(error) {
		$('#status').text('');
		if (error instanceof multiModule.NoSuchSessionError) {
			alert('This seems to be the wrong game code.\nPlease try again!');
		} else if (error instanceof multiModule.JoiningDisabledError) {
			alert('This seems is currently running.\nPlease try again later!');
		} else {
			onError(error.message);
		}
	}

	function joinSession() {
		$('#joining input.code').blur();
		$('#status').text('loading');
		var token = $('#joining input.code').val();
		// timeout so the sofware keyboard can go away
		setTimeout(function () {
			multi.joinSession(token).then(onSession, onJoinSessionFailed).done();
		}, 200);
	}

	var multi = multiModule.init(multiOptions);
	$('#status').text('');
	showSection('joining');

	$('#joining button.join').click(joinSession);
	$('#joining input.code').on('keypress', function (event) {
		var key = event.keyCode || event.which;
		if (key === 13) {
			joinSession();
		}
	});

	$('#joining button.start').click(function () {
		$('#status').text('loading');
		multi.createSession().then(onSession, onCreateSessionFailed).done();
	});

});