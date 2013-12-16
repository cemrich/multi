requirejs.config({
	paths: {
		'socket.io': '/socket.io/socket.io.js'
	}
});

requirejs(['../lib/multi', '../lib/joystick', '../lib/jquery-2.0.0.min'],
	function (multiModule, Joystick) {

	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	var session = null;
	var arranger = null;
	var joystick = null;

	var multiOptions = {
		server: '192.168.0.100',
		session: {
			scriptName: 'games/serverOnescreenSnake/index.js'
		}
	};

	function showSection(section) {
		$('.section').hide();
		$('#' + section).show();
	}

	function addPlayer(player) {
		var playerView = $('<div></div>');
		playerView.addClass('player');
		playerView.css('height', player.height/10);
		playerView.css('max-width', player.width/10);

		var setColor = function () {
			playerView.css('background-color', player.attributes.color);
		};

		setColor();
		$('.players').append(playerView);

		player.on('attributeChanged/color', setColor);
		player.on('draw', function (event) {
			//console.log(event.data);
			context.beginPath();
			context.strokeStyle = player.attributes.color;
			context.moveTo(event.data.x, event.data.y);
			context.lineTo(event.data.x+event.data.width, event.data.y+event.data.height);
			context.stroke();
			context.closePath();
		});
		player.on('disconnected', function () {
			playerView.remove();
		});
	}

	function onError(message) {
		showSection('error');
		$('#status').text('disconnected');
		$('#error').text(message);
	}

	function onStartGame() {
		updateCanvasBorders();
		showSection('game');
		joystick.start();
	}

	function onGameFinished() {
		showSection('joined');
		joystick.stop();
	}

	function updateCanvasBorders() {
		var dangerZone = document.getElementById('danger-zone');
		var pattern = context.createPattern(dangerZone, 'repeat');
		var width = 14;
		var globalStartY, myStartY, myEndY;

		context.lineWidth = width * 2;
		context.strokeStyle = pattern;
		context.strokeRect(0, 0, canvas.width, canvas.height);

		context.globalCompositeOperation = 'destination-out';
		context.beginPath();
		var myScreen = session.myself.screen;
		if (myScreen.rightPlayers[0]) {
			globalStartY = myScreen.rightPlayers[0].screen.y;
			myStartY = myScreen.globalToLocal(0, globalStartY);
			myEndY = Math.min(myStartY.y + myScreen.rightPlayers[0].height,
				myScreen.height);
			context.moveTo(canvas.width, myStartY.y + width);
			context.lineTo(canvas.width, myEndY - width);
		}
		if (myScreen.leftPlayers[0]) {
			globalStartY = myScreen.leftPlayers[0].screen.y;
			myStartY = myScreen.globalToLocal(0, globalStartY);
			myEndY = Math.min(myStartY.y + myScreen.leftPlayers[0].height,
				myScreen.height);
			context.moveTo(0, myStartY.y + width);
			context.lineTo(0, myEndY - width);
		}
		context.stroke();
		context.closePath();
		context.globalCompositeOperation = 'source-over';
		context.lineWidth = 1;
	}

	function onSession(s) {
		session = s;

		function onDirectionChange(direction) {
			session.myself.attributes.direction = direction;
		}

		arranger = new multiModule.ScreenArranger(session);
		joystick = new Joystick(30, onDirectionChange, $('.joystick'), $('html'));
		showSection('joined');
		$('#status').text('connected');
		$('.join-url').text(session.joinSessionUrl);
		$('.join-url').attr('href', 'http://' + session.joinSessionUrl);
		session.getPlayerArray().forEach(addPlayer);
		session.on('destroyed', onSessionDestroyed);
		session.on('playerJoined', function (event) {
			addPlayer(event.player);
		});
		$('button.start').click(function () {
			session.message('startGame');
		});
		session.on('startGame', onStartGame);
		session.on('finished', onGameFinished);
	}

	function onSessionDestroyed() {
		onError('session has been destroyed');
		if (joystick !== null) {
			joystick.stop();
		}
	}

	function onSessionFailed(error) {
		onError(error.message);
	}


	var multi = multiModule.init(multiOptions);
	multi.autoJoinElseCreateSession().then(onSession, onSessionFailed).done();
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

});