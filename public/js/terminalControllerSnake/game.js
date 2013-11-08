/*
The actual game (screen)
*/

define(['../lib/multi'], function (multi) {

	var Game = function (session, showSection) {

		multi.EventDispatcher.call(this);

		this.session = session;
		this.showSection = showSection;
		this.number = 0;
		this.interval = null;

	};

	multi.util.inherits(Game, multi.EventDispatcher);

	Game.prototype.loop = function () {
		$('#presenter-game').text(this.number++);
	};

	// (re) start this game
	Game.prototype.start = function () {
		this.dispatchEvent('start');
		this.showSection('#presenter-game');
		this.interval = setInterval(this.loop.bind(this), 100);
	};

	// stop all game action hard
	Game.prototype.stop = function () {
		clearInterval(this.interval);
		this.dispatchEvent('stop');
	};

	return {
		Game: Game
	};

});