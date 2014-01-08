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
		var game = new Game(session, onError, showSection);
		session.on('destroyed', function () {
			game.stop();
		});
	}

	function onSessionFailed(error) {
		onError(error.message);
	}

	var multi = multiModule.init(multiOptions);
	multi.autoJoinElseCreateSession().then(onSession, onSessionFailed).done();

});