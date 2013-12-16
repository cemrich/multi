/* global exports */

var multiModule = require('../../multi/server');
var ScreenArranger = require('../../multi/shared/screen').ScreenArranger;
var Snake = require('./snake');


exports.Game = function (session) {

	var snakes = [];

	function move() {
		var dead = [];
		snakes.forEach(function (snake) {
			snake.update();
			if (!snake.isAlive()) {
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

	function onStartGame() {
		for (var i in session.players) {
			snakes.push(new Snake(session.players[i], arranger));
		}
		// very, very simple gameloop for the start
		setInterval(function () {
			move();
		}, 100);
		// session.message('finished');
	}

	var arranger = new ScreenArranger(session);
	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);

};