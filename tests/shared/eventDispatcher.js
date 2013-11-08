/* global EventDispatcher, test, ok, start, stop, expect */

test('test initialization', function (assert) {
	ok(EventDispatcher, 'eventDispatcher module is defined');
	var dispatcher = new EventDispatcher();
	ok(dispatcher, 'instance can be created');
});

test('only added listener functions should be called', function (assert) {
	expect(2);
	stop();
	
	var dispatcher = new EventDispatcher();
	var data = { test: 'event' };
	dispatcher.on('myEvent', function (data) {
		ok(true, 'first event received');
		// test data
	});
	dispatcher.on('myEvent', function (data) {
		ok(true, 'second event received');
		start();
	});
	dispatcher.on('mySecondEvent', function (data) {
		// should not be called
	});
	dispatcher.dispatchEvent('myEvent', data);
});

test('removed listener functions should not be called', function (assert) {
	expect(1);
	stop();
	
	var dispatcher = new EventDispatcher();
	function listener(data) {
		ok(true, 'event received');
		dispatcher.off('myEvent', listener);
		dispatcher.dispatchEvent('myEvent');
		start();
	}
	dispatcher.on('myEvent', listener);
	dispatcher.dispatchEvent('myEvent');
});

test('once-listeners are only called one', function (assert) {
	expect(1);
	stop();

	var dispatcher = new EventDispatcher();
	function listener(data) {
		// should only be called once
		ok(true, 'event received');
		dispatcher.dispatchEvent('myEvent');
		start();
	}
	dispatcher.once('myEvent', listener);
	dispatcher.dispatchEvent('myEvent');
});