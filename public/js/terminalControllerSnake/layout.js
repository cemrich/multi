
define(['./sound', '../lib/jquery-2.0.0.min'], function (sound) {

	var colors = [
		{r: 255, g:   0, b:   0, hex: '#FF0000'},
		{r:   0, g: 255, b:   0, hex: '#00FF00'},
		{r:   0, g:   0, b: 255, hex: '#0000FF'}
	];

	function showSection(section) {
		$('#preloader').hide();
		$('.section').hide();
		$(section).show();
	}

	function showError(message) {
		sound.onError();
		showSection('#error');
		$('#error .message').text(message);
	}

	return {
		showSection: showSection,
		showError: showError,
		colors: colors
	};
});