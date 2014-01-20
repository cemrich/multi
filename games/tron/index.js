/* global module */

var multiModule = require('../../multi/server');
var ScreenArranger = multiModule.screens.HorizontalArranger;
var Lightcycle = require('./Lightcycle');


module.exports = function (session) {

	var COLORS = ['#01E2EC', '#EB0067', '#33D92C',
		'#DA6A03', '#9D32FF','#F2F311', '#FD3333',
		'#0000FF', '#FD00F3'];

	var lightcycles = null;
	var interval = null;
	var arranger = new ScreenArranger(session);

	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);
	session.on('destroyed', onSessionDestroyed);


	function move() {
		var dead = [];
		lightcycles.forEach(function (lightcycle) {
			lightcycle.update();
			if (lightcycle.isDead(lightcycles)) {
				dead.push(lightcycle);
				lightcycle.owner.message('died');
			}
		});
		dead.forEach(function (lightcycle) {
			lightcycles.splice(lightcycles.indexOf(lightcycle), 1);
		});
		if (lightcycles.length === 0) {
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
		lightcycles = [];

		for (var i in session.players) {
			lightcycles.push(new Lightcycle(session.players[i], arranger));
		}

		session.on('playerLeft', onPlayerLeft);

		// very, very simple gameloop for the start
		interval = setInterval(move, 100);
	}

};