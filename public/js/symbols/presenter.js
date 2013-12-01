define(function(require, exports, module) {

	var gameModule = require('./game');
	var sound = null;

	function onPlayerConnected(event) {
		sound.onPlayerJoin();
		var p = $('<div class="player"></div>');
		$('#new .players').append(p);
		event.player.on('disconnected', function (event) {
			sound.onPlayerDisconnect();
			p.remove();
		});
		event.player.on('attributesChanged', function () {
			var color = event.player.attributes.color;
			p.css('background-color', color);
		});
	}

	function onReadyClick(event) {
		$('#new .manual').hide();
		$('#new .symbols').show();
	}

	function onSessionCreated(session) {
		var game = new gameModule.Game(session, sound);
		var token = session.token.toString();
		for (var i = 0; i < token.length; i++) {
			var symbol = $('#new .symbols').children().get(token[i]);
			$(symbol).attr('class', 'icon');
		}

		$('#new a.session-url').text(window.location);
		$('#new a.session-url').attr('href', window.location);

		session.on('playerJoined', onPlayerConnected);
		session.on('destroyed', function () {
			alert('Opps - you have no connection. Try a reload when your connection returns.');
		});
		session.on('start', function () {
			$('#new').hide();
			$('#field').show();
			game.start();
		});

		$('#new').show();
		$('#loading').hide();
		$('#new .symbols').css('pointer-events', 'none');
	}

	function go(multi, soundModule) {
		sound = soundModule;
		$('#new .ready').click(onReadyClick);
		$('#intro').hide();
		$('#loading').show();
		window.scrollTo(0, 1);

		multi.createSession().then(onSessionCreated).done();
	}

	exports.go = go;
});