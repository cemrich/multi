define(function(require, exports, module) {

	var multi = null;
	var sound = null;
	var session = null;

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

	function onSessionJoined(joinedSession) {
		session = joinedSession;
		sound.onPlayerJoin();

		$('#join').hide();
		$('#created').show();
		$('#loading').hide();

		session.myself.on('attributesChanged', function () {
			$('body').css('background-color', session.myself.attributes.color);
		});

		session.on('destroyed', function () {
			alert('Opps - you have no connection. Try a reload when your connection returns.');
		});

		$('html').click(changeColor);
	}

	function changeColor() {
		var color = multi.color.random();
		session.myself.attributes.color = color;
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