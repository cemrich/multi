/* global module */


function Segment(startX, startY) {
	this.x1 = startX;
	this.y1 = startY;
	this.x2 = startX;
	this.y2 = startY;
}
Segment.prototype.getWidth = function () {
	return Math.abs(this.x2 - this.x1);
};
Segment.prototype.getHeight = function () {
	return Math.abs(this.y2 - this.y1);
};
Segment.prototype.getTop = function () {
	return this.y2 - this.y1 < 0 ? this.y2 : this.y1;
};
Segment.prototype.getLeft = function () {
	return this.x2 - this.x1 < 0 ? this.x2 : this.x1;
};
Segment.prototype.getBottom = function () {
	return this.y2 - this.y1 < 0 ? this.y1 : this.y2;
};
Segment.prototype.getRight = function () {
	return this.x2 - this.x1 < 0 ? this.x1 : this.x2;
};
Segment.prototype.intersects = function (segment) {
	var x1 = this.getLeft();
	var x2 = this.getRight();
	var y1 = this.getTop();
	var y2 = this.getBottom();
	return ((segment.x1 < x2 || segment.x2 < x2) &&
		(segment.x1 > x1 || segment.x2 > x2) &&
		(segment.y1 > y1 || segment.y2 > y1) &&
		(segment.y1 < y2 || segment.y2 < y2));
};


function Lightcycle (owner, arranger) {
	this.owner = owner;
	this.arranger = arranger;

	// start at center of display (global coords)
	var display = owner;
	var localX = Math.round(display.width / 2);
	var localY = Math.round(display.height / 2);

	this.speed = 5;
	this.dir = -1;
	this.lastDir = -1;

	var initialPos = display.screen.localToGlobal(localX, localY);
	this.curSegment = new Segment(initialPos.x, initialPos.y);
	this.segments = [];
}

Lightcycle.prototype.update = function () {
	this.move();
	this.updateDisplay();
};

Lightcycle.prototype.move = function () {
	this.lastDir = this.dir;
	this.dir = this.owner.attributes.direction || 0;

	if (this.dir !== this.lastDir) {
		// direction changed - start a new segment
		this.curSegment = new Segment(this.curSegment.x2, this.curSegment.y2);
		this.segments.push(this.curSegment);
	}

	switch (this.dir) {
	case 0:
		this.curSegment.y2 -= this.speed;
		break;
	case 1:
		this.curSegment.x2 += this.speed;
		break;
	case 2:
		this.curSegment.y2 += this.speed;
		break;
	case 3:
		this.curSegment.x2 -= this.speed;
		break;
	}
};

Lightcycle.prototype.isDead = function (lightcycles) {
	return !this.isInsidePlayingField() || this.hits(lightcycles);
};

Lightcycle.prototype.isInsidePlayingField = function () {
	return this.arranger.isAnyPlayerHit(this.curSegment.x2, this.curSegment.y2);
};

Lightcycle.prototype.hits = function (lightcycles) {
	return lightcycles.some(function (lightcycle) {
		return lightcycle.isHitBy(this);
	}, this);
};

Lightcycle.prototype.isHitBy = function (lightcycle) {
	return this.segments.some(function (segment) {
		return segment !== lightcycle.curSegment &&
			segment.intersects(lightcycle.curSegment);
	});
};

Lightcycle.prototype.updateDisplay = function () {
	var width = this.curSegment.getWidth();
	var height = this.curSegment.getHeight();
	var left = this.curSegment.getLeft();
	var top = this.curSegment.getTop();
	var locals = this.arranger.globalRectToLocals(left, top, width, height);
	for (var i in locals) {
		var local = locals[i];
		this.owner.message('draw',
			{
				x: local.x,
				y: local.y,
				width: width,
				height: height
			},
			local.player, true);
	}
};

module.exports = Lightcycle;