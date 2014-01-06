define(function(require, exports, module) {

	var multiModule = require('../lib/multi');
	var multi = null;
	var sound = null;
	var session = null;
	var presenter = null;
	var symbolArray = new multiModule.token.SymbolArray(9);

	function onIconClick(event) {
		sound.onSymbol();
		var icon = $(event.currentTarget);
		var isActive = symbolArray.toggle(icon.index());
		var classes = isActive ? 'icon' : 'icon inactive';
		icon.attr('class', classes);
	}

	function onJoinSessionClick(event) {
		var sessionCode = symbolArray.toToken();
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
			alert('Opps - you have no connection to the terminal. Try a reload when your connection returns.');
		});

		changeColor();
		$('html').click(changeColor);
	}

	function changeColor() {
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