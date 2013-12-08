/* global PubSub, test, ok, equal, deepEqual, start, asyncTest, expect */

test('test listener length', function () {
	var pubSub = new PubSub();
	equal(pubSub.listeners.length, 0, 'unused pubSub has no listeners');
	var token1 = pubSub.subscribe(function () {}, function () {});
	pubSub.subscribe(function () {}, function () {});
	pubSub.subscribe(function () {}, function () {});
	equal(pubSub.listeners.length, 3, 'pubSub has 3 listeners after 3 subscriptions');
	pubSub.unsubscribe(token1);
	equal(pubSub.listeners.length, 2, 'listeners length decreases by one after unsubscribe');
	pubSub.unsubscribeAll();
	equal(pubSub.listeners.length, 0, 'unused pubSub has no listeners after unsubscribeAll');
});

asyncTest('test publish/subscribe', function () {
	expect(3);

	var message1 = { num: 0 };
	var message2 = { num: 1 };
	var pubSub = new PubSub();

	var callback1 = function (message) {
		// this is called for every message (2 times)
		ok(true, 'callback1 has been called');
	};
	var callback2 = function (message) {
		// this should be called exactly _once_ when message1 is published
		deepEqual(message, message1, 'callback2 receives the right message');
		start();
	};

	pubSub.subscribe(callback1, function (message) {
		return true;
	});
	pubSub.subscribe(callback2, function (message) {
		return message.num === 0;
	});

	pubSub.publish(message1);
	pubSub.publish(message2);
});
