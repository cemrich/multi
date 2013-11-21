
define(['../../lib/jquery-2.0.0.min'], function () {

	var board = $('#finished .scoreboard');

	function getText(player) {
		var text = 'player ' + player.number;
		text += ' - ' + player.attributes.points + ' points';
		return text;
	}

	function compare(p1, p2) {
		return p2.getAttribute('data-points') - p1.getAttribute('data-points');
	}

	// sorts the complete scoreboard
	function sort() {
		var players = board.find('.player');
		players.sort(compare);
		players.remove();
		board.append(players);
	}

	// adds one player column to the scoreboard
	function addToScoreboard(player) {
		if (player.role === 'player') {
			var playerEle = $('<li class="player"></li>');
			playerEle.text(getText(player));
			playerEle.attr('data-points', player.attributes.points);
			playerEle.css('background-color', player.attributes.color.hex);
			board.append(playerEle);

			function attributesChanged(event) {
				if (event.key === 'points') {
					playerEle.text(getText(player));
					playerEle.attr('data-points', player.attributes.points);
					sort();
				}
			}

			function onDisconnected() {
				playerEle.remove();
			}

			player.on('attributesChanged', attributesChanged);
			player.on('disconnected', onDisconnected);
			playerEle.bind('stop', function() {
				player.off('attributesChanged', attributesChanged);
				player.off('disconnected', onDisconnected);
			});
		}
	}

	function start(session) {
		board.empty();
		session.getPlayerArray().forEach(addToScoreboard);
		sort();
	}

	function stop() {
		board.find('.player').trigger('stop');
	}

	return {
		stop: stop,
		start: start
	}
});