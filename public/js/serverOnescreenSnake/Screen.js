
define(function () {

	var BORDER_WIDTH = 14;

	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;

	var dangerZone = document.getElementById('danger-zone');
	var pattern = context.createPattern(dangerZone, 'repeat');


	var Screen = function (session, arranger) {
		this.session = session;
		this.arranger = arranger;
	};

	Screen.prototype.drawPlayer = function (player, x, y, width, height) {
		context.beginPath();
		context.strokeStyle = player.attributes.color;
		context.moveTo(x, y);
		context.lineTo(x + width, y + height);
		context.stroke();
		context.closePath();
	};

	Screen.prototype.updateBorders = function () {
		var globalStartY, myStartY, myEndY;

		context.lineWidth = BORDER_WIDTH * 2;
		context.strokeStyle = pattern;
		context.strokeRect(0, 0, canvas.width, canvas.height);

		context.globalCompositeOperation = 'destination-out';
		context.beginPath();
		var myScreen = this.session.myself.screen;
		if (myScreen.rightPlayers[0]) {
			globalStartY = myScreen.rightPlayers[0].screen.y;
			myStartY = myScreen.globalToLocal(0, globalStartY);
			myEndY = Math.min(myStartY.y + myScreen.rightPlayers[0].height,
				myScreen.height);
			context.moveTo(canvas.width, myStartY.y + BORDER_WIDTH);
			context.lineTo(canvas.width, myEndY - BORDER_WIDTH);
		}
		if (myScreen.leftPlayers[0]) {
			globalStartY = myScreen.leftPlayers[0].screen.y;
			myStartY = myScreen.globalToLocal(0, globalStartY);
			myEndY = Math.min(myStartY.y + myScreen.leftPlayers[0].height,
				myScreen.height);
			context.moveTo(0, myStartY.y + BORDER_WIDTH);
			context.lineTo(0, myEndY - BORDER_WIDTH);
		}
		context.stroke();
		context.closePath();
		context.globalCompositeOperation = 'source-over';
		context.lineWidth = 1;
	};

	return Screen;
});