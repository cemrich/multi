/*
One player snake as minimal example.
One screen as controller, one sreen as presenter.
*/
// TODO: add possibility to destroy a session when presenter disconnects

requirejs(['../lib/multi', '/socket.io/socket.io.js', '../lib/jquery-2.0.0.min'], function (multiModule, socketio) {

	// TODO: allow some of the callbacks to be passed through options
	// is this possible with promises, too?
	// TODO: disallow client connects when a certain player number is exceeded
	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/',
		session: {
			minPlayerNeeded: 2
		}
	};

	var multi = multiModule.init(multiOptions);

	function showSection(section) {
		$('#preloader').hide();
		$('.section').hide();
		$(section).show();
	}

	function onSessionFailed(error) {
		// I can neither create nor join a session - bad thing
		console.error(error);
	}

	function onSessionDestroyed() {
		// something went wrong - my session does not longer exist
		showSection();
		alert('Ooops. The connection dropped. Try to reload.');
	}

	function onSession(session) {
		// I've created or joined a session
		session.once('destroyed', onSessionDestroyed);
		var roleModule;
		if (session.myself.role === 'presenter') {
			roleModule = './presenter';
		} else {
			roleModule = './controller';
		}
		requirejs([roleModule], function (roleModule) {
			roleModule.start(session, showSection);
		});
	}

	multi.autoJoinElseCreateSession().then(onSession, onSessionFailed).done();
});