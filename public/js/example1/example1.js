
requirejs(['../lib/multi', '/socket.io/socket.io.js'], function (multiModule, socketio) {

	console.log('Multi loaded:', multiModule);
	
	var multiOptions = {
		io: socketio,
		server: 'http://localhost/'
	};

	var multi = multiModule.init(multiOptions);
	multi.createSession();

	multi.on('sessionCreated', function (event) {
		console.log('sessionCreated', event);
		multi.joinSession(event.token);
	});

	multi.on('sessionJoined', function (event) {
		console.log('sessionJoined', event);
	});

});