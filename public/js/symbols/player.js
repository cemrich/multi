define(function(require, exports, module) {

	var multi = null;

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
		$('.icon').each(function (i, ele) {
			var icon = $(ele);
			var isActive = (icon.attr('data-active') === 'active');
			if (isActive) {
				sessionCode += i.toString();
			}
		});
		sessionCode = parseInt(sessionCode);
		multi.joinSession(sessionCode);
	}

	function onJoinSessionFailed(event) {
		alert('Oh, crap - this game does not exist. Try again!');
	}

	function onSessionJoined(event) {
		$('#symbols').hide();
		$('#join').hide();
		$('#created').show();
	}

	function go(multiInstance) {
		multi = multiInstance;
		multi.on('joinSessionFailed', onJoinSessionFailed);
		multi.on('sessionJoined', onSessionJoined);
		$('#join .join').click(onJoinSessionClick);
		$('.icon').click(onIconClick);
		$('#intro').hide();
		$('#symbols').show();
		$('#join').show();
	}

	exports.go = go;
});