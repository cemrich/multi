define(['../shared/eventDispatcher'], function(EventDispatcher) {

	// createSession()
	var Player = function () {};

	Player.prototype = new EventDispatcher();
	
	return { test: 'test' };

});
