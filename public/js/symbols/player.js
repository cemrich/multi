define(function(require, exports, module) {

	var multiModule = require('../lib/multi');
	var multi = null;
	var sound = null;
	var session = null;
	var presenter = null;

	function onIconClick(event) {
		sound.onSymbol();
		var icon = $(event.currentTarget);
		var isActive = (icon.attr('data-active') === 'active');
		if (isActive) {
			icon.attr('class', 'icon inactive');
			icon.attr('data-active', '');
		} else {
			icon.attr('class', 'icon');
			icon.attr('data-active', 'active');
		}
	}

	function onJoinSessionClick(event) {
		var sessionCode = '';
		$('#join .icon').each(function (i, ele) {
			var icon = $(ele);
			var isActive = (icon.attr('data-active') === 'active');
			if (isActive) {
				sessionCode += i.toString();
			}
		});
		multi.joinSession(sessionCode).then(onSessionJoined, onJoinSessionFailed).done();
		$('#loading').show();
	}

	function onJoinSessionFailed(error) {
		sound.onPlayerDisconnect();
		$('#loading').hide();
		alert('Oh, crap - this game does not exist. Try again!');
	}

	function onUpClick() {
		session.myself.message('move', { direction: 'up' }, presenter);
	}
	function onDownClick() {
		session.myself.message('move', { direction: 'down' }, presenter);
	}

	function onStart() {
		sound.onStart();
		$('#created').hide();
		$('#controls').show();
		$('html').off('click', changeColor);
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
		session.on('start', onStart);

		changeColor();
		$('html').click(changeColor);
	}

	function onStartGameClick(event) {
		event.stopPropagation();
		session.message('start');
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
		$('#controls .up').click(onUpClick);
		$('#controls .down').click(onDownClick);
		$('#created .start').click(onStartGameClick);
		$('#intro').hide();
		$('#join').show();
	}

	exports.go = go;
});