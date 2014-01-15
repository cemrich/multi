/* jshint camelcase: false */
/*
All points.
*/

define(function () {

	var Points = function (jaws, grid) {
		this.jaws = jaws;
		this.grid = grid;
		this.anim = null;
		this.points = new jaws.SpriteList();
	};

	Points.prototype.handleCollision = function (snake) {
		var collisions = this.jaws.collideOneWithMany(snake.head, this.points);
		if (collisions.length > 0) {
			snake.eatPoints(collisions.length);
		}
		for (var i in collisions) {
			this.points.remove(collisions[i]);
			this.addNew();
		}
	};

	Points.prototype.addNew = function () {
		var position = this.grid.getRandomPosition();
		var sprite = new this.jaws.Sprite({ x: position.x, y: position.y, anchor: 'center' });
		sprite.setImage(this.anim.next());
		this.points.push(sprite);
	};

	Points.prototype.setup = function () {
		var sheet = new this.jaws.Animation({
			sprite_sheet: '../../img/snake.png',
			frame_size: [20, 20],
			frame_duration: 500
		});
		this.anim = sheet.slice(3, 5);
		this.addNew();
		this.addNew();
	};

	// called according to global framerate
	Points.prototype.update = function () {
		var points = this;
		this.points.forEach(function(point) {
			point.setImage(points.anim.next());
		});
	};

	Points.prototype.draw = function () {
		this.points.draw();
	};

	return Points;

});