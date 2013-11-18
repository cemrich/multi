/* jshint camelcase: false */
/*
The snake object
*/

define(['./sound', '../lib/canvasHelper'], function (sound, canvasHelper) {

	var Snake = function (jaws, grid, player) {
		this.jaws = jaws;
		this.grid = grid;
		this.player = player;
		this.headAnim = null;
		this.tailAnim = null;
		this.head = null;
		this.tail = new jaws.SpriteList();
		this.expired = 0;
		this.fps = 1/2 * 1000; // speed in fps * 1000
		this.segmetsToAdd = 0;
		this.direction = 0;
		this.directionObject = player.attributes;
		this.directionObject.direction = 0;
	};

	Snake.prototype.getNewTailElement = function (prev) {
		var tailElement = new this.jaws.Sprite({ x: prev.x, y: prev.y, anchor: 'center' });
		tailElement.setImage(this.tailAnim.next());
		tailElement.prev = prev;
		this.tail.push(tailElement);
		return tailElement;
	};

	Snake.prototype.setup = function () {
		var snakeAnim = new this.jaws.Animation({
			sprite_sheet: '../../img/snake.png',
			frame_size: [20, 20],
			frame_duration: 500});
		var rgb = this.player.attributes.color;
		if (typeof rgb !== 'undefined') {
			snakeAnim.frames.forEach(function (canvas) {
				canvasHelper.replaceHues(canvas, rgb);
			});
		}
		var x = this.player.number / 2 * this.grid.width;
		x -= x % this.grid.tileSize + this.grid.halfTileSize;
		var y = this.grid.centerY;
		this.tailAnim = snakeAnim.slice(0, 1);
		this.headAnim = snakeAnim.slice(1, 3);
		this.head = new this.jaws.Sprite({ x: x, y: y, anchor: 'center' });
		this.head.setImage(this.headAnim.next());
		this.head.isFree = false;
		this.tail.push(this.head);
		var prev = this.head;
		for (var i = 0; i < 10; i++) {
			var tailElement = this.getNewTailElement(prev);
			prev = tailElement;
		}
	};

	Snake.prototype.eatPoints = function (number) {
		sound.onPoint();
		this.segmetsToAdd += number;
		this.fps *= Math.pow(0.9, number);
	};

	// which direction?
	Snake.prototype.updateDirection = function () {
		this.head.isFree = true;
		var oppositeDir = (this.directionObject.direction + 2) % 4;
		if (this.direction !== oppositeDir) {
			this.direction = this.directionObject.direction;
		}
		switch (this.direction) {
			case 0: // up
				this.head.y -= this.grid.tileSize;
				this.head.rotateTo(-90);
				break;
			case 1: // right
				this.head.x += this.grid.tileSize;
				this.head.rotateTo(0);
				break;
			case 2: // down
				this.head.y += this.grid.tileSize;
				this.head.rotateTo(90);
				break;
			case 3: // left
				this.head.x -= this.grid.tileSize;
				this.head.rotateTo(180);
				break;
			default:
				break;
		}
	};

	// don't leave the canvas
	Snake.prototype.checkBoundaries = function () {
		if (this.head.x < this.grid.minX) {
			this.head.x = this.grid.maxX;
		}
		if (this.head.y < this.grid.minY) {
			this.head.y = this.grid.maxY;
		}
		if (this.head.x > this.grid.maxX) {
			this.head.x = this.grid.minX;
		}
		if (this.head.y > this.grid.maxY) {
			this.head.y = this.grid.minY;
		}
	};

	// update tail to move behind head
	Snake.prototype.moveTail = function () {
		var lastIndex = this.tail.length-1;
		// add new segment if needed
		if (this.segmetsToAdd > 0) {
			this.getNewTailElement(this.tail.at(lastIndex));
			this.segmetsToAdd--;
		}
		// move
		for (var i = lastIndex; i > 0; i--) {
			var ele = this.tail.at(i);
			ele.setImage(this.tailAnim.next());
			ele.x = ele.prev.x;
			ele.y = ele.prev.y;
		}
	};

	// called once per snake tick
	// so snakes can have different speed values
	Snake.prototype.tick = function () {
		sound.onSnakeMove();
		this.moveTail();
		this.updateDirection();
		this.checkBoundaries();
	};

	// called according to global framerate
	Snake.prototype.update = function () {
		this.head.setImage(this.headAnim.next());

		this.expired += this.jaws.game_loop.tick_duration;
		if (this.expired >= this.fps) {
			this.expired = 0;
			this.tick();
		}
	};

	// is the snake biting itself or another snake
	Snake.prototype.isDead = function (snakes) {
		var that = this;
		var dead = false;
		if (!snakes) {
			snakes = [this];
		}
		snakes.some(function (snake) {
			var collisions = that.jaws.collideOneWithMany(that.head, snake.tail);
			if (collisions.length > 0 && that.head.isFree) {
				dead = true;
				return true;
			}
		});
		return dead;
	};

	Snake.prototype.draw = function () {
		this.tail.draw();
		this.head.draw();
	};

	return Snake;

});