var multiModule = require('../multi/server');


exports.Game = function (session) {

	var snakes = [];

	function Snake (owner, display) {
		this.owner = owner;
		this.display = display;
		this.x = Math.round(display.width / 2);
		this.y = Math.round(display.height / 2) + owner.number*5;
		snakes.push(this);

		this.move = function () {
			this.x++;
		};
	};

	function move() {
		snakes.forEach(function (snake) {
			snake.move();
			snake.display.message('draw', { playerId: snake.owner.id, x: snake.x, y: snake.y });
		});
	}

	function onPlayerJoined(event) {
		// TODO: cannot send messages here
		event.player.attributes.color = multiModule.color.random();
		new Snake(event.player, event.player);
	}

	function onStartGame() {
		setInterval(function () {
			move();
		}, 500);
		// session.message('finished');
	}

	session.on('playerJoined', onPlayerJoined);
	session.on('startGame', onStartGame);

};