/* global SyncedObject, test, asyncTest, start, expect, ok, deepEqual */

test('test setup', function () {
	var sync = new SyncedObject();
	deepEqual(sync.data, {}, 'data is empty on setup');
});

asyncTest('test add new attributes', function () {
	expect(4);

	var data1 = { foo: 'bar' };
	var data2 = [ { test: 'test' } ];
	var sync = new SyncedObject();
	sync.startWatching();

	sync.on('changed', function (changeset) {
		ok(changeset.changed.hasOwnProperty('data1'), 'data1 is in changed object');
		ok(changeset.changed.hasOwnProperty('data2'), 'data2 is in changed object');
		deepEqual(changeset.changed.data1, data1, 'data1 has the right value');
		deepEqual(changeset.changed.data2, data2, 'data2 has the right value');
		start();
	});

	sync.data.data1 = data1;
	sync.data.data2 = data2;
});

asyncTest('test delete attributes', function () {
	expect(1);

	var sync = new SyncedObject();
	sync.data.data1 = 'test';
	sync.startWatching();

	sync.on('changed', function (changeset) {
		deepEqual(changeset.removed, ['data1'], 'changeset contains name of removed attribute');
		start();
	});

	delete sync.data.data1;
});