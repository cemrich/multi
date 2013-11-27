/* global sessionModule, test, equal, deepEqual */

test('test getPlayerArray', function (assert) {
	var session = sessionModule.create();
	deepEqual(session.getPlayerArray(), [], 'empty session should return empty player array');

	session.players['0'] = { number: 0 };
	session.players['1'] = { number: 1 };
	session.players['9'] = { number: 9 };

	var players = session.getPlayerArray();
	equal(players.length, 3, 'player array should have length of added players count');
	equal(players[0].number, 0, 'first player should have lowest number');
	equal(players[1].number, 1, 'second player should have second lowest number');
	equal(players[2].number, 9, 'last player should have highest number');
});
