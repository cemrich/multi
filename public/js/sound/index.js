requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['./capture', './output', '../lib/multi', '../SERVER', '../lib/jquery-2.0.0.min'],
		function (capture, output, multiModule, SERVER) {

	var multiOptions = {
		server: SERVER,
		session: {
			token: {
				func: 'soundToken', // see app.js
				args: [capture.HALF_TOKEN_LENGTH]
			}
		}
	};

	var multi = multiModule.init(multiOptions);
	$('#loading').hide();

	$('#intro .new').click(createSession);
	$('#intro .join').click(joinSession);


	function onError(error) {
		if (!(error instanceof multiModule.NoSuchSessionError)) {
			alert('ERROR:\n' + error.message);
			output.stop();
			capture.stop();
		}
	}

	function joinSession() {
		$('#intro').hide();
		$('#join').show();
		capture.start(function (token) {
			console.log('try to join', token);
			multi.joinSession(token).then(onSessionJoined, onError);
		}, function () {
			$('#microphone').addClass('active');
		});
	}

	function createSession() {
		multi.createSession().then(onSessionCreated, onError);
	}

	function onSessionCreated(session) {
		$('#intro').hide();
		$('#new').show();
		output.start(session.token);
		session.on('playerJoined', function (player) {
			$('#new').hide();
			$('#created').show();
			output.stop();
		});
		session.on('playerLeft', function (player) {
			window.location.reload();
		});
	}

	function onSessionJoined(session) {
		capture.stop();
		$('#microphone').removeClass('active');
		$('#join').hide();
		$('#created').show();
		session.on('playerLeft', function (player) {
			window.location.reload();
		});
	}
});
