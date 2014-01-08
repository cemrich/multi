/* global exports */

var multiModule = require('../../multi/server');
var ScreenArranger = multiModule.screens.HorizontalArranger;
var Snake = require('./snake');


exports.Game = function (session) {

	var COLORS = ['#01E2EC', '#EB0067', '#33D92C',
		'#DA6A03', '#9D32FF','#F2F311', '#FD3333',
		'#0000FF', '#FD00F3'];

	var snakes = null;
	var interval = null;
	var arranger = new ScreenArranger(session);

	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);
	session.on('destroyed', onSessionDestroyed);


	function move() {
		var dead = [];
		snakes.forEach(function (snake) {
			snake.update();
			if (snake.isDead(snakes)) {
				dead.push(snake);
				snake.owner.message('died');
			}
		});
		dead.forEach(function (snake) {
			snakes.splice(snakes.indexOf(snake), 1);
		});
		if (snakes.length === 0) {
			onEndGame();
		}
	}

	function onPlayerJoined(event) {
		event.player.attributes.color = COLORS[event.player.number%COLORS.length];
	}

	function onSessionDestroyed() {
		onEndGame();
	}

	function onPlayerLeft() {
		onEndGame();
	}

	function onEndGame() {
		session.enablePlayerJoining();
		clearInterval(interval);
		session.message('finished');
		session.removeListener('playerLeft', onPlayerLeft);
	}

	function onStartGame() {
		session.disablePlayerJoining();
		snakes = [];

		for (var i in session.players) {
			snakes.push(new Snake(session.players[i], arranger));
		}

		session.on('playerLeft', onPlayerLeft);

		// very, very simple gameloop for the start
		interval = setInterval(move, 100);
	}

};