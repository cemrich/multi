/*
One player snake as minimal example.
One screen as controller, one sreen as presenter.
*/
// TODO: add possibility to destroy a session when presenter disconnects

requirejs(['../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'], function (multiModule, socketio) {

	// TODO: allow some of the callbacks to be passed through options
	// is this possible with promises, too?
	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/'
	};
	var session = null;
	var multi = multiModule.init(multiOptions);

	function showSection(section) {
		$('#preloader').hide();
		$('.section').hide();
		$(section).show();
	}

	function onSessionCreated(session) {
		// I'm connected as presenter now
		requirejs(['./presenter'], function (presenterModule) {
			presenterModule.start(session, showSection);
		});
	}

	function onSessionCreationFailed(error) {
		// I can neither create nor join a session - bad thing
		console.error(error);
	}

	function onSessionJoined(session) {
		// I'm connected as controller now
		requirejs(['./controller'], function (controllerModule) {
			controllerModule.start(session, showSection);
		});
	}

	function onAutoJoinFailed(error) {
		// I was not able to connect as controller
		// assuming I want to create a new session
		// TODO: autoJoinElseCreate could be moved to lib
		multi.createSession().then(onSessionCreated, onSessionCreationFailed).done();
	}

	// TODO: look into this "Unhandled rejection reasons (should be empty)" warning by Q
	multi.autoJoinSession().then(onSessionJoined, onAutoJoinFailed).done();
});