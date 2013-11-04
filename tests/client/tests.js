requirejs.config({
	baseUrl: '../../public/js/lib/'
});


requirejs(['multi', 'http://localhost/socket.io/socket.io.js'], function (multiModule, socketio) {

	var multiOptions = {
		io: socketio,
		server: 'http://localhost/'
	};
	var multi = multiModule.init(multiOptions);

	test("test multi setup", function() {
		ok(multiModule, "multiModule is defined");
		ok(multiModule.color, "multiModule.color is defined");
	});

	test("test initialization", function () {
		ok(multi, "instance created successfully");
		raises(function () {
			multi.init({});
		}, "only one call to init allowed", "creation of second instance throws error");
	});

	asyncTest("test session creation", function () {
		expect(3);
		multi.createSession().then(function (session) {
			ok(session, "session can be created");
			ok(session.token, "session has a token");
			ok(session.myself, "session has own player added");
			start();
		});
	});

	asyncTest("test connection to existing session", function () {
		expect(5);
		multi.createSession().then(function (session) {
			var createdSession = session;
			var joinedSession = null;
			multi.joinSession(createdSession.token).then(function (session) {
				joinedSession = session;
				ok(joinedSession, "session can be joined");
				ok(joinedSession.myself, "session has own player added");
				equal(joinedSession.token, createdSession.token, "session tokens are equal");ok(joinedSession.players[createdSession.myself.id], "old player added to new session");
				multi.off('sessionJoined');
				start();
			});
			createdSession.on('playerJoined', function (event) {
				ok(createdSession.players[joinedSession.myself.id], "new player added to created session");
			});
		});
	});

	// all modules & tests loaded, so begin testing
	QUnit.start();

});
