requirejs(['../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'], function (multiModule, socketio) {

	// TODO: use eventEmitter and util from socketio

	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/',
		session: {
			scriptName: 'games/serverOnescreenSnake.js'
		}
	};

	function addPlayer(player) {
		var playerView = $('<div></div>');
		playerView.addClass('player');
		playerView.css('background-color', player.attributes.color);
		$('#players').append(playerView);
		player.on('disconnected', function () {
			playerView.remove();
		});
		player.on('attributesChanged', function () {
			playerView.css('background-color', player.attributes.color);
		});
	}

	function onError(message) {
		$('#status').text(message);
	}

	function onSession(session) {
		$('#status').text('connected');
		$('#join-url').text(session.joinSessionUrl);
		$('#join-url').attr('href', 'http://' + session.joinSessionUrl);
		// TODO: players are sorted the wrong way
		session.getPlayerArray().forEach(addPlayer);
		session.on('destroyed', onSessionDestroyed);
		session.on('playerJoined', function (event) {
			addPlayer(event.player);
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