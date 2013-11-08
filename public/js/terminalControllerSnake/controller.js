/*
Dumb game controller for the snake.
*/

define(function () {

	var SNAP_THRESHOLD = 30;
	var downMarker = $('#controller .down');
	var moveMarker = $('#controller .move');

	function start(session, showSection) {

		var direction = null;
		var startPos;

		function onDirectionChange(direction) {
			$('#marker').attr('class', 'dir' + direction);
			session.myself.attributes.direction = direction;
		}

		function getEventPosition(event) {
			var pos = {};
			if (event.originalEvent.hasOwnProperty('targetTouches')) {
				pos.x = event.originalEvent.targetTouches[0].pageX;
				pos.y = event.originalEvent.targetTouches[0].pageY;
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
			var snapX = pos.x > startPos.x - SNAP_THRESHOLD &&
				pos.x < startPos.x + SNAP_THRESHOLD;
			var snapY = pos.y > startPos.y - SNAP_THRESHOLD &&
				pos.y < startPos.y + SNAP_THRESHOLD;
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
					onDirectionChange(direction);
				}
			}
			moveMarker.css('top', pos.y);
			moveMarker.css('left', pos.x);
		}

		function onUp(event) {
			$('html').off('touchmove mousemove', onMove);
			downMarker.hide();
			moveMarker.fadeOut();
		}

		// controller starting point
		// TODO: make this work with multitouch (first touch is king)
		// TODO: macke this work in firefox mobile
		// TODO: maybe a own module would be cleaner
		function onDown(event) {
			$('html').one('touchend mouseup', onUp);
			$('html').on('touchmove mousemove', onMove);
			startPos = getEventPosition(event);
			$('.marker').css('top', startPos.y);
			$('.marker').css('left', startPos.x);
			downMarker.show();
			moveMarker.fadeIn();
		}

		function startGame() {
			showSection('#controller');
			session.once('finished', onFinished);
			$('html').on('touchstart mousedown', onDown);
		}

		function onAgainClick(event) {
			// player wants to play again
			session.message('again');
			startGame();
		}

		function onExitClick(event) {
			// with one player bored the game is over
			window.close();
		}

		function onFinished() {
			// game is finished
			$('html').off('touchstart mousedown', onDown);
			showSection('#controller-finished');
			$('#controller-finished .again').one('click', onAgainClick);
			$('#controller-finished .exit').one('click', onExitClick);
		}

		function onBelowMinPlayerNeeded() {
			// we don't have enough players any longer
			// means our presenter has disconnected - quit
			// TODO: nicer syntax like session.myself.disconnect()
			session.disconnectMyself();
		}

		session.on('belowMinPlayerNeeded', onBelowMinPlayerNeeded);
		startGame();

	}

	return {
		start: start
	};
});