requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

var getUserMedia = navigator.getUserMedia || 
	navigator.webkitGetUserMedia || 
	navigator.mozGetUserMedia;
window.URL = (window.URL || window.mozURL || window.webkitURL);

requirejs(['../lib/multi', '../SERVER', '../lib/jquery-2.0.0.min'],
	function (multiModule, SERVER) {

	var video = document.getElementById('video');
	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var players = $('#joined .players');
	var session = null;
	var stream = null;

	var multiOptions = {
		server: SERVER
	};

	function showSection(section) {
		$('.section').hide();
		$('#' + section).show();
	}

	function addPlayer(player) {
		var playerView = $('<div></div>');
		playerView.addClass('player');
		playerView[0].style.order = player.number;
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
		if (session) {
			session.myself.disconnect();
		}
		if (stream) {
			stream.stop();
		}
	}

	function takeImage() {
		canvas.width = video.videoWidth;
		canvas.height = video.videoHeight;

		context.drawImage(video, 0, 0);

		var imgData = canvas.toDataURL('img/png');
		session.myself.attributes.avatar = imgData;
		$('.player.myself').attr('src', imgData);
		$('#joined .instructions').show();
	}

	function initCamera() {
		if (!getUserMedia) {
			onError('no camera support');
		}
		getUserMedia.call(navigator, {video: true, audio: false}, function(s) {
			stream = s;
			video.src = window.URL.createObjectURL(stream);
			setTimeout(takeImage, 1000);
			video.addEventListener('click', takeImage, false);
		}, function () {
			onError('no video access');
		});
	}

	function addPlayer(player) {
		var playerNode = $('<img></img>').addClass('player');
		if (player === session.myself) {
			playerNode.addClass('myself');
		}
		players.append(playerNode);
		playerNode.attr('src', player.attributes.avatar);
		player.on('attributeChanged/avatar', function (avatar) {
			playerNode.attr('src', avatar);
		});
		player.once('disconnected', function () {
			playerNode.remove();
		});
	}

	function onSession(s) {
		session = s;
		showSection('joined');
		$('#status').text('connected');
		$('#join-url').attr('href', 'http://' + session.joinSessionUrl);
		$('#join-url').text(session.joinSessionUrl);
		initCamera();

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
	multi.autoJoinOrCreateSession().then(onSession, onSessionFailed).done();
	showSection('joined');

});