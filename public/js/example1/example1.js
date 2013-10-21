
requirejs(['../lib/multi', '/socket.io/socket.io.js'], function (multi, socketio) {

	console.log('Multi loaded:', multi);
	
	var multiOptions = {
		io: socketio,
		server: 'http://localhost/'
	};

	multi.init(multiOptions);
	multi.createSession();

});