
define(function(require, exports, module) {

	require('../lib/jquery-2.0.0.min');

	var BORDER_WIDTH = 14;

	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');

	var dangerZone = document.getElementById('danger-zone');
	var pattern = context.createPattern(dangerZone, 'repeat');
	var rightDirection = $('.direction.right');
	var leftDirection = $('.direction.left');


	function getBackgroundImage(color) {
		return 'linear-gradient(white 2px, transparent 2px),' +
			'linear-gradient(90deg, white 2px, transparent 2px),' +
			'linear-gradient(' + color + ' 2px, transparent 2px),' +
			'linear-gradient(90deg, ' + color + ' 2px, transparent 2px)';
	}


	var Screen = function (session, arranger) {
		this.session = session;
		this.arranger = arranger;
		canvas.width = session.myself.width;
		canvas.height = session.myself.height;
		session.myself.getAttributeAsync('color').then(function (color) {
			$('#bg').css('background-image', getBackgroundImage(color));
		});
	};

	Screen.prototype.clearPlayers = function () {
		context.clearRect(0, 0, canvas.width, canvas.height);
		this.updateBorders();
	};

	Screen.prototype.drawStartingPoint = function () {
		context.beginPath();
		context.strokeStyle = this.session.myself.attributes.color;
		context.arc(canvas.width/2, canvas.height/2, 5, 0, 2 * Math.PI);
		context.stroke();
	};

	Screen.prototype.drawPlayer = function (player, x, y, width, height) {
		context.beginPath();
		context.strokeStyle = player.attributes.color;
		context.moveTo(x, y);
		context.lineTo(x + width, y + height);
		context.stroke();
		context.closePath();
	};

	Screen.prototype.setArrows = function (player, arrow) {
		if (player) {
			arrow.show();
			player.getAttributeAsync('color').then(function (color) {
				arrow.css('color', color);
			});
		} else {
			arrow.hide();
		}
	};

	Screen.prototype.getPlayerY = function (player) {
		var y = {};
		var myScreen = this.session.myself.screen;

		var globalStartY = player.screen.y;
		y.start = Math.max(myScreen.globalToLocal(0, globalStartY).y, 0);
		y.end = Math.min(y.start + player.height, myScreen.height);
		y.start += BORDER_WIDTH;
		y.end -= BORDER_WIDTH;

		return y;
	};

	Screen.prototype.updateBorders = function () {
		var y;

		context.lineWidth = BORDER_WIDTH * 2;
		context.strokeStyle = pattern;
		context.strokeRect(0, 0, canvas.width, canvas.height);

		context.globalCompositeOperation = 'destination-out';
		context.beginPath();
		var myScreen = this.session.myself.screen;

		var rightPlayer = myScreen.rightPlayers[0];
		this.setArrows(rightPlayer, rightDirection);
		if (rightPlayer) {
			y = this.getPlayerY(rightPlayer);
			context.moveTo(canvas.width-1, y.start);
			context.lineTo(canvas.width-1, y.end);
		}

		var leftPlayer = myScreen.leftPlayers[0];
		this.setArrows(leftPlayer, leftDirection);
		if (leftPlayer) {
			y = this.getPlayerY(leftPlayer);
			context.moveTo(1, y.start);
			context.lineTo(1, y.end);
		}

		context.stroke();
		context.closePath();
		context.globalCompositeOperation = 'source-over';
		context.lineWidth = 2;
	};

	return Screen;
});