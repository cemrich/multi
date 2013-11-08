define(function(require, exports, module) {

	exports.Game = function (session, sound) {

		var field = $('#field');

		function buildPlayer(player) {
			var p = $('<div class="head"></div>')
				.css('background-color', player.attributes.color);
			field.append(p);
			player.on('move', function (event) {
				if (event.data.direction === 'up') {
					p.css('top', '30%');
				} else if (event.data.direction === 'down') {
					p.css('top', '80%');
				}
			});
		}

		function buildPlayers() {
			for (var i in session.players) {
				buildPlayer(session.players[i]);
			}
		}

		this.start = function () {
			sound.onStart();
			buildPlayers();
		};
	};

});