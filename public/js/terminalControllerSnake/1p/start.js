/* global role */

/*
One player snake as minimal example.
One screen as controller, one sreen as presenter.
*/
// TODO: add possibility to destroy a session when presenter disconnects

requirejs(['../../lib/multi', '/socket.io/socket.io.js', '../sound', '../layout', '../../lib/jquery-2.0.0.min'], function (multiModule, socketio, sound, layout) {

	var SESSION_TOKEN = 'myOnlySession';

	// TODO: allow some of the callbacks to be passed through options
	// is this possible with promises, too?
	var multiOptions = {
		io: socketio,
		server: 'http://tinelaptopsony/',
		session: {
			minPlayerNeeded: 2,
			maxPlayerAllowed: 2,
			token: {
				// static token because we only need a single session
				// TODO: make sure you cannot create a session
				// that does already exits!
				func: 'staticToken',
				args: [SESSION_TOKEN]
			}
		}
	};

	var multi = multiModule.init(multiOptions);

	function onSessionFailed(error) {
		// autojoining or creating a session failed
		if (error instanceof multiModule.SessionFullError) {
			layout.showError('This game has enough player already. Please try again later.');
		} else if (error instanceof multiModule.NoConnectionError) {
			layout.showError('There is no server connection. Please try again later.');
		} else if (error instanceof multiModule.NoSuchSessionError) {
			layout.showError('This game does not exist. Make sure your URL is correct.');
		} else {
			layout.showError('Something went terribly wrong. Please try again.');
		}
	}

	function onSessionDestroyed() {
		// something went wrong - my session does not longer exist
		sound.onDisconnect();
		layout.showError('Ooops. The connection dropped. Try to reload.');
	}

	function onSession(session) {
		// I've created or joined a session
		session.once('destroyed', onSessionDestroyed);
		var roleModule = './' + role;
		requirejs([roleModule], function (roleModule) {
			roleModule.start(session);
		});
	}

	// create the session or join it
	// the role variable has been set inside the views
	if (role === 'presenter') {
		multi.createSession().then(onSession, onSessionFailed).done();
	} else {
		multi.joinSession(SESSION_TOKEN).then(onSession, onSessionFailed).done();
	}
});