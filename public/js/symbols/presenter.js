define(function(require, exports, module) {

	var sound = null;

	function onPlayerConnected(event) {
		sound.onPlayerJoin();
		var p = $('<div class="player"></div>');
		$('#new .players').append(p);
		event.player.on('disconnected', function (event) {
			sound.onPlayerDisconnect();
			p.remove();
		});
		event.player.on('attributeChanged/color', function (color) {
			p.css('background-color', color);
		});
	}

	function onReadyClick(event) {
		$('#new .manual').hide();
		$('#new .symbols').show();
	}

	function onSessionCreated(session) {
		var token = session.token;
		var symbols = $('#new .symbols').children();
		for (var i = 0; i < token.length; i++) {
			var symbol = symbols.get(token[i]);
			$(symbol).attr('class', 'icon');
		}

		$('#new a.session-url').text(window.location);
		$('#new a.session-url').attr('href', window.location);

		session.on('playerJoined', onPlayerConnected);
		session.on('destroyed', function () {
			alert('Opps - you have no connection. Try a reload when your connection returns.');
		});

		$('#new').show();
		$('#loading').hide();
		$('#new .symbols').css('pointer-events', 'none');
	}

	function onSessionFailed(error) {
		alert('Opps - you have no connection. Try a reload when your connection returns.');
	}

	function go(multi, soundModule) {
		sound = soundModule;
		$('#new .ready').click(onReadyClick);
		$('#intro').hide();
		$('#loading').show();
		window.scrollTo(0, 1);

		multi.createSession().then(onSessionCreated, onSessionFailed).done();
	}

	exports.go = go;
});