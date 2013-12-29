/* global exports */

var multiModule = require('../../multi/server');
var ScreenArranger = multiModule.screens.HorizontalArranger;
var Snake = require('./snake');


exports.Game = function (session) {

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
			if (!snake.isAlive() || snake.hits(snakes)) {
				dead.push(snake);
			}
		});
		dead.forEach(function (snake) {
			snakes.splice(snakes.indexOf(snake), 1);
		});
	}

	function onPlayerJoined(event) {
		event.player.attributes.color = multiModule.color.random();
	}

	function onSessionDestroyed() {
		onEndGame();
	}

	function onPlayerLeft() {
		onEndGame();
	}

	function onEndGame() {
		clearInterval(interval);
		session.removeListener('playerLeft', onPlayerLeft);
	}

	function onStartGame() {
		snakes = [];

		for (var i in session.players) {
			snakes.push(new Snake(session.players[i], arranger));
		}

		session.on('playerLeft', onPlayerLeft);

		// very, very simple gameloop for the start
		interval = setInterval(function () {
			move();
			console.log('tick');
		}, 100);
		// session.message('finished');
	}

};