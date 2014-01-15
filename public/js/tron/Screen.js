
define(function () {

	var BORDER_WIDTH = 14;

	var canvas = document.getElementById('canvas');
	var context = canvas.getContext('2d');

	var dangerZone = document.getElementById('danger-zone');
	var pattern = context.createPattern(dangerZone, 'repeat');


	var Screen = function (session, arranger) {
		this.session = session;
		this.arranger = arranger;
		canvas.width = session.myself.width;
		canvas.height = session.myself.height;
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
			myStartY = Math.max(myScreen.globalToLocal(0, globalStartY).y, 0);
			myEndY = Math.min(myStartY + myScreen.rightPlayers[0].height,
				myScreen.height);
			context.moveTo(canvas.width, myStartY + BORDER_WIDTH);
			context.lineTo(canvas.width, myEndY - BORDER_WIDTH);
		}
		if (myScreen.leftPlayers[0]) {
			globalStartY = myScreen.leftPlayers[0].screen.y;
			myStartY = Math.max(myScreen.globalToLocal(0, globalStartY).y, 0);
			myEndY = Math.min(myStartY + myScreen.leftPlayers[0].height,
				myScreen.height);
			context.moveTo(0, myStartY + BORDER_WIDTH);
			context.lineTo(0, myEndY - BORDER_WIDTH);
		}
		context.stroke();
		context.closePath();
		context.globalCompositeOperation = 'source-over';
		context.lineWidth = 2;
	};

	return Screen;
});