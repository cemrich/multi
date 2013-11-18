/* jshint camelcase: false */
/* global jaws */

/*
The actual game (screen)
*/

define(['../../lib/multi', '../snake', '../points', '../grid', '../layout', '../../lib/jaws'], function (multi, Snake, Points, Grid, layout) {

	// some one time setup calculation for the grid
	var grid = new Grid(22);

	var Game = function (session) {
		multi.EventDispatcher.call(this);

		this.points = new Points(jaws, grid);
		this.session = session;
		this.interval = null;
		this.snakes = [];
		
		for (var i in session.players) {
			this.addPlayer(session.players[i]);
		}
	};

	multi.util.inherits(Game, multi.EventDispatcher);

	Game.prototype.addPlayer = function(player) {
		var game = this;
		var snake = new Snake(jaws, grid, player, this.session.getPlayerCount());
		player.once('disconnected', function (event) {
			game.deleteSnake(snake);
		});
		this.snakes.push(snake);
	};

	Game.prototype.deleteSnake = function(snake) {
		var index = this.snakes.indexOf(snake);
		if (index !== -1) {
			this.snakes.splice(index, 1);
		}
	};

	// jaws setup callback
	Game.prototype.setup = function() {
		jaws.clear();
		this.snakes.forEach(function (snake) {
			snake.setup();
		});
		this.points.setup();
		this.dispatchEvent('start');
	};

	// jaws gametick callback for game logic
	Game.prototype.update = function() {
		var game = this;
		this.points.update();

		var deadSnakeIndizes = [];
		this.snakes.forEach(function (snake, index) {
			// do stuff with every snake
			game.points.handleCollision(snake);
			snake.update();
			if (snake.isDead(game.snakes)) {
				deadSnakeIndizes.push(index);
				snake.player.message('dead');
			}
		});
		// remove dead snakes
		for (var i in deadSnakeIndizes) {
			this.snakes.splice(deadSnakeIndizes[i], 1);
		}
		// all snakes dead?
		if (this.snakes.length === 0) {
			this.stop();
		}
	};

	// jaws draw callback
	Game.prototype.draw = function() {
		jaws.clear();
		this.points.draw();
		this.snakes.forEach(function (snake) {
			snake.draw();
		});
	};

	// all assets are there - ready to start
	Game.prototype.onAssetsLoaded = function () {
		jaws.game_loop = new jaws.GameLoop(this, {fps: 30});
		jaws.game_loop.start();
	};

	// (re) start this game
	Game.prototype.start = function () {
		layout.showSection('#game');
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