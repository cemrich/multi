/* global test, ok, raises, asyncTest, expect, start, QUnit, equal, deepEqual */

requirejs.config({
	baseUrl: '../../public/js/lib/',
	paths: {
		'socket.io': 'http://localhost/socket.io/socket.io.js'
	}
});


requirejs(['multi'], function (multiModule) {

	var multiOptions = {
		server: 'http://localhost/'
	};
	var multi = multiModule.init(multiOptions);

	test('test multi setup', function() {
		ok(multiModule, 'multiModule is defined');
		ok(multiModule.color, 'multiModule.color is defined');
	});

	test('test initialization', function () {
		ok(multi, 'instance created successfully');
		raises(function () {
			multi.init({});
		}, 'only one call to init allowed', 'creation of second instance throws error');
	});

	asyncTest('test session creation', function () {
		expect(3);
		multi.createSession().then(function (session) {
			ok(session, 'session can be created');
			ok(session.token, 'session has a token');
			ok(session.myself, 'session has own player added');
			start();
		});
	});

	asyncTest('test connection to existing session', function () {
		expect(9);
		multi.createSession().then(function (session) {
			var createdSession = session;
			var joinedSession = null;
			multi.joinSession(createdSession.token).then(function (session) {
				joinedSession = session;
				ok(joinedSession, 'session can be joined');
				ok(joinedSession.myself, 'session has own player added');
				equal(joinedSession.myself.role, 'player', 'joined player has a player role');
				equal(joinedSession.token, createdSession.token, 'session tokens are equal');
				ok(joinedSession.players[createdSession.myself.id], 'old player added to new session');

				function checkNewPlayer() {
					ok(createdSession.players[joinedSession.myself.id], 'new player added to created session');
					equal(createdSession.myself.role, 'presenter', 'first player has a presenter role');
					equal(createdSession.getPlayerCount(), 2, 'getPlayerCount of created session should be two');
					equal(joinedSession.getPlayerCount(), 2, 'getPlayerCount of joined session should be two');
					start();
				}

				if (Object.keys(createdSession.players).length === 1) {
					checkNewPlayer();
				} else {
					createdSession.on('playerJoined', checkNewPlayer);
				}
			});
		});
	});

	asyncTest('test mirroring session messages', function () {
		expect(4);

		multi.createSession().then(function (session) {
			var data = { test: 42, foo: 'bar' };
			var createdSession = session;

			multi.joinSession(createdSession.token).then(function (session) {

				createdSession.on('ping', function (event) {
					ok(true, 'ping message received');
					createdSession.message('pong', data);
				});
				session.on('pong', function (event) {
					ok(true, 'pong message received');
					equal(event.type, 'pong', 'message type is correct');
					deepEqual(event.data, data, 'message data is correct');
					start();
				});

				session.message('ping');
			});
		});
	});

	asyncTest('test mirroring player messages', function () {
		expect(4);

		multi.createSession().then(function (session) {
			var data = { test: 42, foo: 'bar' };
			var createdSession = session;

			multi.joinSession(createdSession.token).then(function (session) {
				session.myself.on('pong', function (event) {
					ok(true, 'pong message received');
					equal(event.type, 'pong', 'message type is correct');
					deepEqual(event.data, data, 'message data is correct');
					start();
				});

				function startPing() {
					createdSession.players[session.myself.id].on('ping', function (event) {
						ok(true, 'ping message received');
						var toPlayer = createdSession.players[session.myself.id];
						toPlayer.message('pong', data, toPlayer);
					});
					session.myself.message('ping', null, session.getPlayerArray());
				}

				if (Object.keys(createdSession.players).length === 1) {
					startPing();
				} else {
					createdSession.on('playerJoined', startPing);
				}
			});
		});
	});

	asyncTest('test attribute synchronization', function () {
		expect(2);

		multi.createSession().then(function (session) {
			var data = { test: 42, foo: 'bar' };
			var createdSession = session;

			multi.joinSession(createdSession.token).then(function (session) {
				session.myself.on('attributeChanged/data', function (value) {
					deepEqual(value, data, 'event recognizes to which value attribute changed');
					deepEqual(session.myself.attributes.data, data, 'attributes were really updated');
					start();
				});

				function startSync() {
					var otherPlayer = createdSession.players[session.myself.id];
					otherPlayer.attributes.data = data;
				}

				if (Object.keys(createdSession.players).length === 1) {
					startSync();
				} else {
					createdSession.on('playerJoined', startSync);
				}
			});
		});
	});

	asyncTest('cannot create session with same token twice', function () {
		expect(1);
		var sessionParams = {
			token: {
				func: 'staticToken',
				args: ['myStaticSessionToken']
			}
		};
		multi.createSession(sessionParams).then(function (session) {
			multi.createSession(sessionParams).fail(function (error) {
				ok(error instanceof multiModule.TokenAlreadyExistsError, 'throwing an TokenAlreadyExistsError');
				session.disconnectMyself();
				start();
			}).done();
		}).done();
	});

	asyncTest('test disconnectMyself', function () {
		expect(3);
		multi.createSession().then(function (session) {
			var createdSession = session;

			multi.joinSession(createdSession.token).then(function (session) {
				var player = session.players[createdSession.myself.id];
				player.on('disconnected', function () {
					ok(true, 'disconnected event is fired on disconnected player');
					equal(session.getPlayerCount(), 1, 'player count is one after disconnect');
					start();
				});

				createdSession.on('destroyed', function () {
					ok(true, 'destroyed event is fired on session on own client');
				});

				function disconnect() {
					createdSession.disconnectMyself();
				}

				if (Object.keys(createdSession.players).length === 1) {
					disconnect();
				} else {
					createdSession.on('playerJoined', disconnect);
				}
			});
		});
	});

	asyncTest('test disable and enable player joining', function () {
		expect(2);
		multi.createSession().then(function (session) {

			// disable
			session.disablePlayerJoining();
			var failJoin = multi.joinSession(session.token).fail(function (error) {
				var isDisabledError = error instanceof multiModule.JoiningDisabledError;
				ok(isDisabledError, 'JoiningDisabledError is thrown');
			});

			failJoin.then(function () {
				// enable again
				session.enablePlayerJoining();
				multi.joinSession(session.token).then(function () {
					ok(true, 'enablePlayerJoining enables joining again');
					start();
				}).done();
			}).done();

		}).done();
	});

	// all modules & tests loaded, so begin testing
	QUnit.start();

});
