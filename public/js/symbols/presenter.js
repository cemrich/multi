define(function(require, exports, module) {

	var multi = null;
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

	function onSessionCreated(event) {
		var token = event.session.token.toString();
		for (var i = 0; i < token.length; i++) {
			var symbol = $('#new .symbols').children().get(token[i]);
			$(symbol).attr('class', 'icon');
		}
		event.session.on('playerJoined', onPlayerConnected);
		$('#new').show();
		$('#loading').hide();
		$('#new .symbols').css('pointer-events', 'none');
	}

	function go(multiInstance, soundModule) {
		multi = multiInstance;
		sound = soundModule;
		multi.on('sessionCreated', onSessionCreated);
		$('#new .ready').click(onReadyClick);
		$('#intro').hide();
		$('#loading').show();
		window.scrollTo(0, 1);
		multi.createSession();
	}

	exports.go = go;
});