requirejs(['./sound', '../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'],
		function (sound, multiModule, socketio) {

	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/',
		session: {
			scriptName: 'games/symbols',
			token: {
				func: 'symbolPattern',
				args: [1, 4]
			}
		}
	};
	var multi = multiModule.init(multiOptions);
	$('#loading').hide();
	sound.init();

	$('button').click(function (event) {
		sound.onButton();
	});

	$('#intro .new').click(function(event) {
		requirejs(['../symbols/presenter'], function (presenterModule) {
			presenterModule.go(multi, sound);
		});
	});

	$('#intro .join').click(function (event) {
		requirejs(['../symbols/player'], function (playerModule) {
			playerModule.go(multi, sound);
		});
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
