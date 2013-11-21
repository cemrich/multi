/*
Module for this joystick-like thingy that's part of the controller.
*/

define(function () {

	function Joystick(threshold, directionCallback, container) {

		var eventEmitter = $('html');
		var downMarker = container.find('.down');
		var moveMarker = container.find('.move');
		var direction = null;
		var startPos;

		function getEventPosition(event) {
			var pos = {};
			if (typeof event.originalEvent.touches !== 'undefined') {
				pos.x = event.originalEvent.touches[0].pageX;
				pos.y = event.originalEvent.touches[0].pageY;
			} else {
				pos.x = event.clientX;
				pos.y = event.clientY;
			}
			return pos;
		}

		function onMove(event) {
			event.preventDefault();
			var newDirection = direction;
			var pos = getEventPosition(event);
			var snapX = pos.x > startPos.x - threshold &&
				pos.x < startPos.x + threshold;
			var snapY = pos.y > startPos.y - threshold &&
				pos.y < startPos.y + threshold;
			if (!(snapX && snapY)) {
				if (snapX) {
					pos.x = startPos.x;
					newDirection = (pos.y < startPos.y) ? 0 : 2;
				}
				if (snapY) {
					pos.y = startPos.y;
					newDirection = (pos.x < startPos.x) ? 3 : 1;
				}
				if (newDirection !== direction) {
					direction = newDirection;
					directionCallback(direction);
				}
			}
			moveMarker.css('top', pos.y);
			moveMarker.css('left', pos.x);
		}

		function onUp(event) {
			eventEmitter.off('touchmove mousemove', onMove);
			downMarker.hide();
			moveMarker.fadeOut();
		}

		// controller starting point
		// TODO: make this work with multitouch (first touch is king)
		function onDown(event) {
			eventEmitter.one('touchend mouseup', onUp);
			eventEmitter.on('touchmove mousemove', onMove);
			startPos = getEventPosition(event);
			downMarker.css('top', startPos.y);
			downMarker.css('left', startPos.x);
			moveMarker.css('top', startPos.y);
			moveMarker.css('left', startPos.x);
			downMarker.show();
			moveMarker.fadeIn();
		}


		// PUBLIC

		this.start = function () {
			direction = null;
			eventEmitter.on('touchstart mousedown', onDown);
		};

		this.stop = function () {
			eventEmitter.off('touchstart mousedown', onDown);
			downMarker.hide();
			moveMarker.fadeOut();
		};

	}

	return Joystick;

});