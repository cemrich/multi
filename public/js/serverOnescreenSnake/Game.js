define(function (require, exports, module) {

	var Screen = require('./Screen');
	var multiModule = require('../lib/multi');
	var Joystick = require('../lib/joystick');


	var Game = function(session, onError, showSection) {

		var game = this;
		this.onError = onError;
		this.showSection = showSection;
		this.arranger = new multiModule.screens.HorizontalArranger(session);
		this.screen = new Screen(session, this.arranger);
		this.joystick = new Joystick(30, function (direction) {
				session.myself.attributes.direction = direction;
			}, false, $('.joystick'), $('html'));
		

		// VIEW SETUP
		this.screen.updateBorders();
		this.showSection('joined');


		// LISTENERS
		session.getPlayerArray().forEach(this.addPlayer.bind(this));

		session.on('playerJoined', function (event) {
			game.addPlayer(event.player);
		});
		session.on('startGame', this.onStartGame.bind(this));
		session.on('finished', this.onGameFinished.bind(this));

		$('button.start').click(function () {
			session.message('startGame');
		});
		this.arranger.on('arrangementChanged', function () {
			game.screen.updateBorders();
		});

		session.myself.on('died', this.onPlayerDied.bind(this));
		session.myself.getAttributeAsync('color')
			.then(this.setPlayerColor.bind(this));
	};

	Game.prototype.setPlayerColor = function (color) {
		$('.joystick > *').css('background-color', color);
		$('html').css('color', color);
		$('button').css('border-color', color);
	};

	Game.prototype.onStartGame = function () {
		$('h1.title').hide();
		this.screen.drawStartingPoint();
		this.showSection('game');
		this.joystick.start();
	};

	Game.prototype.onGameFinished = function () {
		$('h1.title').show();
		this.showSection('joined');
		this.screen.clearPlayers();
		this.joystick.stop();
	};

	Game.prototype.onPlayerDied = function () {
		this.joystick.stop();
	};

	Game.prototype.addPlayer = function (player) {
		var game = this;
		var playerView = $('<div></div>');
		playerView.addClass('player');
		playerView.css('height', player.height/10);
		playerView.css('max-width', player.width/10);
		playerView[0].style.order = player.number;
		$('.players').append(playerView);

		player.getAttributeAsync('color').then(function (color) {
			playerView.css('background-color', color);
		});
		player.on('draw', function (event) {
			var data = event.data;
			game.screen.drawPlayer(player, data.x, data.y, data.width, data.height);
		});
		player.on('disconnected', function () {
			playerView.remove();
		});
	};

	Game.prototype.stop = function () {
		$('h1.title').hide();
		this.onError('session has been destroyed');
		this.joystick.stop();
	};

	return Game;
});