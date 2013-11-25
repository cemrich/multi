requirejs(['../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'], function (multiModule, socketio) {

	// TODO: use eventEmitter and util from socketio

	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/'
	};

	function onError(message) {
		console.error(message);
	}

	function onSession(session) {
		console.log('session joined');
	}

	function onSessionFailed(error) {
		onError(error.message);
	}


	var multi = multiModule.init(multiOptions);
	multi.autoJoinElseCreateSession().then(onSession, onSessionFailed).done();

});