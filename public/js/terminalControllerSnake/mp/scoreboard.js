
define(['../../lib/jquery-2.0.0.min'], function () {

	var board = $('#finished .scoreboard');

	function getText(player) {
		var text = 'player ' + player.number;
		text += ' - ' + player.attributes.points + ' points';
		return text;
	}

	function addToScoreboard(player) {
		if (player.role === 'player') {
			var playerEle = $('<li class="player"></li>');
			playerEle.text(getText(player));
			playerEle.css('background-color', player.attributes.color.hex);
			board.append(playerEle);

			function attributesChanged(event) {
				if (event.key === 'points') {
					playerEle.text(getText(player));
				}
			}

			player.on('attributesChanged', attributesChanged);
			playerEle.bind('stop', function() {
				player.off('attributesChanged', attributesChanged);
			});
		}
	}

	function start(session) {
		board.empty();
		for (var i in session.players) {
			addToScoreboard(session.players[i]);
		}
		addToScoreboard(session.myself);
	}

	function stop() {
		board.find('.player').trigger('stop');
	}

	return {
		stop: stop,
		start: start
	}
});