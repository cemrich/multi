define(function(require, exports, module) {

	var multiModule = require('../lib/multi');
	var multi = null;
	var sound = null;
	var session = null;
	var presenter = null;
	var symbolArray = [
		false,false,false,
		false,false,false,
		false,false,false
	];

	function onIconClick(event) {
		sound.onSymbol();
		var icon = $(event.currentTarget);
		var index = icon.index();
		var isActive = symbolArray[index] =! symbolArray[index];
		var classes = isActive ? 'icon' : 'icon inactive';
		icon.attr('class', classes);
	}

	function onJoinSessionClick(event) {
		var sessionCode = symbolArray.reduce(function (x, y, index) {
			return y ? x + index : x;
		}, '');
		multi.joinSession(sessionCode).then(onSessionJoined, onJoinSessionFailed).done();
		$('#loading').show();
	}

	function onJoinSessionFailed(error) {
		sound.onPlayerDisconnect();
		$('#loading').hide();
		alert('Oh, crap - this game does not exist. Try again!');
	}

	function onSessionJoined(joinedSession) {
		session = joinedSession;
		presenter = session.getPlayerByNumber(0);
		sound.onPlayerJoin();

		$('#join').hide();
		$('#created').show();
		$('#loading').hide();

		session.on('destroyed', function () {
			// TODO: throw this when presenter disconnects
			// add a reason to the destroyed event
			alert('Opps - you have no connection. Try a reload when your connection returns.');
		});

		changeColor();
		$('html').click(changeColor);
	}

	function changeColor() {
		// TODO: remove color from multi module
		var color = multiModule.color.random();
		session.myself.attributes.color = color;
		$('body').css('background-color', color);
	}

	function go(multiInstance, soundModule) {
		multi = multiInstance;
		sound = soundModule;
		$('#join .join').click(onJoinSessionClick);
		$('#join .icon').click(onIconClick);
		$('#intro').hide();
		$('#join').show();
	}

	exports.go = go;
});