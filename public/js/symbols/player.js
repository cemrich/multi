define(function(require, exports, module) {

	var multi = null;
	var session = null;

	function onIconClick(event) {
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
		sessionCode = parseInt(sessionCode);
		multi.joinSession(sessionCode);
		$('#loading').show();
	}

	function onJoinSessionFailed(event) {
		$('#loading').hide();
		alert('Oh, crap - this game does not exist. Try again!');
	}

	function onSessionJoined(event) {
		$('#join').hide();
		$('#created').show();
		$('#loading').hide();

		session = event.session;
		session.myself.on('attributesChanged', function() {
			$('body').css('background-color', session.myself.attributes.color);
		});

		$('html').click(changeColor);
	}

	function changeColor() {
		console.log('change color');
		var color = multi.color.random();
		session.myself.attributes = { color: color };
	}

	function go(multiInstance) {
		multi = multiInstance;
		multi.on('joinSessionFailed', onJoinSessionFailed);
		multi.on('sessionJoined', onSessionJoined);
		$('#join .join').click(onJoinSessionClick);
		$('#join .icon').click(onIconClick);
		$('#intro').hide();
		$('#join').show();
	}

	exports.go = go;
});