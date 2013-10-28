
requirejs(['../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'], 
		function (multiModule, socketio) {


	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/'
	};

	var multi = multiModule.init(multiOptions);

	multi.on('sessionCreated', function (event) {
		// event.session.token
		// show symbols here
		var token = event.session.token.toString();
		for (var i = 0; i < token.length; i++) {
			var symbol = $('#symbols').children().get(token[i]);
			$(symbol).attr('class', 'icon');
		}
		$('#loading').hide();
		$('#symbols').css('pointer-events', 'none');
		$('#symbols').show();
	});

	$('#intro .new').click(function(event) {
		$('#intro').hide();
		$('#loading').show();
		multi.createSession();
	});

	multi.on('sessionJoined', function (event) {
		$('#symbols').hide();
		$('#join').hide();
		$('#created').show();
	});

	$('#join .join').click(function(event) {
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
	});

	$('#intro .join').click(function(event) {
		$('.icon').click(function (event) {
			var icon = $(event.currentTarget);
			var isActive = (icon.attr('data-active') === 'active');
			if (isActive) {
				icon.attr('class', 'icon inactive');
				icon.attr('data-active', '');
			} else {
				icon.attr('class', 'icon');
				icon.attr('data-active', 'active');
			}
		});
		$('#intro').hide();
		$('#symbols').show();
		$('#join').show();
	});

	/*
	* Replace all SVG images with inline SVG
	*/
	$('.icon').each(function () {
		var img = $(this);
		var imgURL = img.attr('src');

		$.get(imgURL, function(data) {
				// Get the SVG tag, ignore the rest
				var svg = $(data).find('svg');

				// Add replaced image's classes to the new SVG
				var imgClass = img.attr('class');
				svg = svg.attr('class', imgClass);

				// Remove any invalid XML tags as per http://validator.w3.org
				svg = svg.removeAttr('xmlns:a');

				// Replace image with new SVG
				img.replaceWith(svg);
		}, 'xml');
	});

});
