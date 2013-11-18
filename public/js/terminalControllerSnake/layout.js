
define(['./sound', '../lib/jquery-2.0.0.min'], function (sound) {

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
		showError: showError
	};
});