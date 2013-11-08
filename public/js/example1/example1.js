
requirejs(['../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'],
		function (multiModule, socketio) {

	require(['../lib/jquery.qrcode.min']);

	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/'
	};

	var multi = multiModule.init(multiOptions);
	multi.autoJoinSession().then(onSessionJoined);

	function showPlayer(player) {
		var p = $('<li></li>', {'class': player.id}).text(player.id);
		$('.players').append(p);
		player.on('disconnected', function (event) {
			p.remove();
		});
	}

	function handleSession(session, message) {
		console.log('handle session');
		$('.session').text(message + ' session ' + session.token);
		$('.myself').text(session.myself.id);

		for (var i in session.players) {
			showPlayer(session.players[i]);
		}

		var path = window.location.protocol + '//' + window.location.host +
			window.location.pathname + '#' + session.token;
		$('#qr').qrcode(path);
		$('#qr .text').text(path).attr('href', path);

		session.on('playerJoined', function (event) {
			showPlayer(event.player);
		});
		session.on('destroyed', function () {
			$('.session').text('destroyed');
			$('.myself').text('');
			$('.players').empty();
		});
	}

	function onSessionJoined(session) {
		$('.sessionstart').hide();
		handleSession(session, 'joined');
	}

	function onSessionCreated(session) {
		handleSession(session, 'created');
	}

	function onError(error) {
		$('.sessionstart').show();
		console.error(error);
	}

	$('.sessionstart .new').click(function(event) {
		$('.sessionstart').hide();
		multi.createSession().then(onSessionCreated, onError).done();
	});

	$('.sessionstart .join').click(function(event) {
		$('.sessionstart').hide();
		var token = $('.sessionstart .token').val();
		multi.joinSession(token).then(onSessionJoined, onError).done();
	});

});