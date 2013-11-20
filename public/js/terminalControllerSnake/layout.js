
define(['./sound', '../lib/jquery-2.0.0.min'], function (sound) {

	var colors = [
		{r: 104, g:  54, b: 168, hex: '#6836A8'},
		{r:  28, g: 189, b:  21, hex: '#1CBD15'},
		{r: 189, g:  21, b: 108, hex: '#BD156C'},
		{r:  21, g: 194, b: 152, hex: '#15C298'}
	];

	function showSection(section) {
		$('#preloader').hide();
		$('.section').hide();
		$(section).show();
	}

	function showError(message) {
		sound.onError();
		$('#error .message').text(message);
		$('#error .try-again').one('click', function () {
			window.location.reload();
		});
		showSection('#error');
	}

	return {
		showSection: showSection,
		showError: showError,
		colors: colors
	};
});