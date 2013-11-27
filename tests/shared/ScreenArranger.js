/* global sessionModule, screen, test, ok, equal */

test('test ScreenArranger setup', function () {
	var session = sessionModule.create();
	var arranger = new screen.ScreenArranger(session);

	equal(arranger.width, 0, 'width should be 0');
	equal(arranger.height, 0, 'height should be 0');
});

function addPlayer(session, width, height) {
	var id = session.getPlayerCount();
	var player = { width: width, height: height, id: id };
	session.players[id] = player;
	session.emit('playerJoined', { player: player });
	return player;
}

test('test width and height', function () {
	var session = sessionModule.create();
	var arranger = new screen.ScreenArranger(session);

	addPlayer(session, 400, 100);
	equal(arranger.width, 400, 'width should be that of first added player');
	equal(arranger.height, 100, 'height should be that of first added player');

	addPlayer(session, 200, 200);
	equal(arranger.width, 600, 'width should be accumulated');
	equal(arranger.height, 200, 'height should be that of highest player');
});

test('test isPlayerHit', function () {
	var session = sessionModule.create();
	var arranger = new screen.ScreenArranger(session);
	var p0 = addPlayer(session, 400, 100); // 0
	var p1 = addPlayer(session, 200, 200); // 1

	ok(arranger.isPlayerHit(p0, 0, 0), '(0|0) hits first player');
	ok(arranger.isPlayerHit(p0, 399, 99), '(399|99) hits first player');
	ok(!arranger.isPlayerHit(p0, 400, 100), '(400|100) hits not first player');
	ok(arranger.isPlayerHit(p1, 500, 100), '(500|100) hits second player');
	ok(!arranger.isPlayerHit(p0, 200, 150), '(200|150) hits not first player');
	ok(!arranger.isPlayerHit(p1, 200, 150), '(200|150) hits not second player');
});

test('test getPlayerAtCoords', function () {
	var session = sessionModule.create();
	var arranger = new screen.ScreenArranger(session);
	addPlayer(session, 400, 100); // 0
	addPlayer(session, 200, 200); // 1

	var p = arranger.getPlayerAtCoords(0, 0);
	equal(p.id, 0, '(0|0) hits first player');

	p = arranger.getPlayerAtCoords(399, 99);
	equal(p.id, 0, '(399|99) hits first player');

	p = arranger.getPlayerAtCoords(400, 100);
	equal(p.id, 1, '(400|100) hits second player');

	p = arranger.getPlayerAtCoords(500, 100);
	equal(p.id, 1, '(500|100) hits second player');

	p = arranger.getPlayerAtCoords(200, 150);
	equal(p, null, '(200|150) hits no player');
});
