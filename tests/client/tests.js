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
			getMultiInstance();
		}, "only one call to init allowed", "creation of second instance throws error");
	});

	asyncTest("test session creation", function () {
		expect(3);
		multi.on("sessionCreated", function (event) {
			ok(event.session, "session can be created");
			ok(event.session.token, "session has a token");
			ok(event.session.myself, "session has own player added");
			multi.off('sessionCreated');
			start();
		});
		multi.createSession();
	});

	asyncTest("test connection to existing session", function () {
		expect(5);
		multi.on("sessionCreated", function (event) {
			var createdSession = event.session;
			var joinedSession = null;
			multi.on("sessionJoined", function (event) {
				joinedSession = event.session;
				ok(joinedSession, "session can be joined");
				ok(joinedSession.myself, "session has own player added");
				equal(joinedSession.token, createdSession.token, "session tokens are equal");ok(joinedSession.players[createdSession.myself.id], "old player added to new session");
				multi.off('sessionCreated');
				multi.off('sessionJoined');
				start();
			});
			createdSession.on('playerJoined', function (event) {
				ok(createdSession.players[joinedSession.myself.id], "new player added to created session");
			});
			multi.joinSession(event.session.token);
		});
		multi.createSession();
	});

	// all modules & tests loaded, so begin testing
	QUnit.start();

});
