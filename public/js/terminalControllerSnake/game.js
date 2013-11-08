/* jshint camelcase: false */
/* global jaws */

/*
The actual game (screen)
*/

define(['../lib/multi', './snake', '../lib/jaws'], function (multi, Snake) {

	// some one time setup calculation
	var TILE_SIZE = 22;
	var width = document.documentElement.clientWidth;
	var height = document.documentElement.clientHeight;
	width -= width % TILE_SIZE;
	height -= height % TILE_SIZE;
	$('canvas').attr('width', width);
	$('canvas').attr('height', height);


	var Game = function (session, showSection) {

		multi.EventDispatcher.call(this);

		var game = this;
		this.snake = new Snake(jaws, TILE_SIZE, width, height);
		this.session = session;
		this.showSection = showSection;
		this.interval = null;

		var conroller = session.getPlayerArray()[0];
		conroller.on('attributesChanged', function () {
			game.snake.direction = conroller.attributes.direction;
		});
	};

	multi.util.inherits(Game, multi.EventDispatcher);

	// jaws setup callback
	Game.prototype.setup = function() {
		this.snake.setup();
		this.dispatchEvent('start');
	};

	// jaws gametick callback for game logic
	Game.prototype.update = function() {
		this.snake.update();
	};

	// jaws draw callback
	Game.prototype.draw = function() {
		jaws.clear();
		this.snake.draw();
	};

	// all assets are there - ready to start
	Game.prototype.onAssetsLoaded = function () {
		jaws.game_loop = new jaws.GameLoop(this, {fps: 30});
		jaws.game_loop.start();
	};

	// (re) start this game
	Game.prototype.start = function () {
		this.showSection('#presenter-game');
		jaws.assets.add('../../img/snake.png');
		jaws.init();
		jaws.assets.loadAll({onfinish: this.onAssetsLoaded.bind(this)});
	};

	// stop all game action hard
	Game.prototype.stop = function () {
		clearInterval(this.interval);
		jaws.game_loop.stop();
		this.dispatchEvent('stop');
	};

	return Game;

});