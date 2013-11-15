/*
Some collected Properties for the playing ground grid.
Detects browser window dimensions and resized canvas accordingly.
*/

define(function () {

	var Grid = function (tileSize) {
		this.tileSize = tileSize;
		this.halfTileSize = Math.floor(this.tileSize / 2);
		this.width = document.documentElement.clientWidth;
		this.height = document.documentElement.clientHeight;
		this.width -= this.width % this.tileSize;
		this.height -= this.height % this.tileSize;
		this.minX = this.halfTileSize;
		this.minY = this.halfTileSize;
		this.maxX = this.width - this.halfTileSize;
		this.maxY = this.height - this.halfTileSize;
		$('canvas').attr('width', this.width);
		$('canvas').attr('height', this.height);
	};

	Grid.prototype.getRandomPosition = function () {
		var x = Math.floor(Math.random() * (this.width/this.tileSize)) * this.tileSize + this.halfTileSize;
		var y = Math.floor(Math.random() * (this.height/this.tileSize)) * this.tileSize + this.halfTileSize;
		return { x: x, y: y };
	};

	return Grid;

});