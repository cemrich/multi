/* jshint camelcase: false */
/* global jaws */

/*
The actual game (screen)
*/

define(['../lib/multi', './snake', './points',  '../lib/jaws'], function (multi, Snake, Points) {

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
		this.points = new Points(jaws, TILE_SIZE, width, height);
		this.session = session;
		this.showSection = showSection;
		this.interval = null;

		var controller = session.getPlayerArray()[0];
		controller.on('attributesChanged', function () {
			game.snake.setDirection(controller.attributes.direction);
		});
	};

	multi.util.inherits(Game, multi.EventDispatcher);

	// jaws setup callback
	Game.prototype.setup = function() {
		jaws.clear();
		this.snake.setup();
		this.points.setup();
		this.dispatchEvent('start');
	};

	// jaws gametick callback for game logic
	Game.prototype.update = function() {
		this.points.update();
		this.points.handleCollision(this.snake);
		this.snake.update();
		if (this.snake.isDead()) {
			this.stop();
		}
	};

	// jaws draw callback
	Game.prototype.draw = function() {
		jaws.clear();
		this.points.draw();
		this.snake.draw();
	};

	// all assets are there - ready to start
	Game.prototype.onAssetsLoaded = function () {
		jaws.game_loop = new jaws.GameLoop(this, {fps: 30});
		jaws.game_loop.start();
	};

	// (re) start this game
	Game.prototype.start = function () {
		this.showSection('#game');
		jaws.init();
		if (jaws.assets.src_list.length === 0) { // hack around jaws bug
			jaws.assets.add('../../img/snake.png');
			jaws.assets.loadAll({onload: this.onAssetsLoaded.bind(this)});
		} else {
			this.onAssetsLoaded();
		}
	};

	// stop all game action hard
	Game.prototype.stop = function () {
		clearInterval(this.interval);
		jaws.game_loop.stop();
		this.dispatchEvent('stop');
	};

	return Game;

});