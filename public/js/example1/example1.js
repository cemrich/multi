
requirejs(['../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'], 
		function (multiModule, socketio) {


	var multiOptions = {
		io: socketio,
		server: 'http://localhost/'
	};

	var multi = multiModule.init(multiOptions);

	multi.on('sessionCreated', function (event) {
		console.log('sessionCreated', event);
		$('.status').text('created session ' + event.session.token);
	});

	multi.on('sessionJoined', function (event) {
		console.log('sessionJoined', event);
		$('.status').text('joined session ' + event.session.token);
	});

	$('.session .new').click(function(event) {
		$('.session').hide();
		multi.createSession();
	});
	$('.session .join').click(function(event) {
		var token = $('.session .token').val();
		$('.session').hide();
		multi.joinSession(token);
	});

});