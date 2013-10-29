define(function(require, exports, module) {	

	var multi = null;

	function onReadyClick(event) {
		$('#new .manual').hide();
		$('#new .symbols').show();
	}

	function onSessionCreated(event) {
		var token = event.session.token.toString();
		for (var i = 0; i < token.length; i++) {
			var symbol = $('#new .symbols').children().get(token[i]);
			$(symbol).attr('class', 'icon');
		}
		$('#new').show();
		$('#loading').hide();
		$('#new .symbols').css('pointer-events', 'none');
	}

	function go(multiInstance) {
		multi = multiInstance;
		multi.on('sessionCreated', onSessionCreated);
		$('#new .ready').click(onReadyClick);
		$('#intro').hide();
		$('#loading').show();
		window.scrollTo(0, 1);
		multi.createSession();
	}

	exports.go = go;
});