/*
Screen of the snake game that shows all the action.
*/

define(['./game', './sound'], function (Game, sound) {

	var COLORS = [
		{r: 255, g:   0, b:   0},
		{r:   0, g: 255, b:   0},
		{r:   0, g:   0, b: 255},
	];

	function start(session, showSection) {

		var game;

		function startGame() {
			sound.onStartGame();
			game = new Game(session, showSection);
			game.on('stop', onGameFinished);
			game.start();
		}

		function onAgain() {
			// player wants to play again
			startGame();
		}

		function onGameFinished() {
			// assuming the game is finished here
			sound.onGameOver();
			showSection('#finished');
			// TODO: refactor session message to get leaner code
			// and use broadcast OR emit
			session.message('finished');
			session.once('again', onAgain);
		}

		function onPlayerJoined(event) {
			event.player.attributes.color = COLORS[event.player.number];
		}

		function onAboveMinPlayerNeeded() {
			// we have all players we need and can start the game now
			startGame();
		}

		function onBelowMinPlayerNeeded() {
			// we don't have enough players any longer
			sound.onDisconnect();
			game.off('stop', onGameFinished);
			game.stop();
			showSection('#waiting');
		}

		// show url to join this session
		var url = window.location.host + '/snake';
		$('#waiting .controllerUrl').text(url);
		$('#waiting .controllerUrl').attr('href', 'http://' + url);
		showSection('#waiting');

		// waiting for our player
		session.on('aboveMinPlayerNeeded', onAboveMinPlayerNeeded);
		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		session.on('playerJoined', onPlayerJoined);
	}

	return {
		start: start
	};

});