define(function(require, exports, module) {	

	var multi = null;

	function onSessionCreated(event) {
		var token = event.session.token.toString();
		for (var i = 0; i < token.length; i++) {
			var symbol = $('#symbols').children().get(token[i]);
			$(symbol).attr('class', 'icon');
		}
		$('#loading').hide();
		$('#symbols').css('pointer-events', 'none');
	}

	function go(multiInstance) {
		multi = multiInstance;
		multi.on('sessionCreated', onSessionCreated);
		$('#intro').hide();
		$('#loading').show();
		$('#symbols').show();
		multi.createSession();
	}

	exports.go = go;
});