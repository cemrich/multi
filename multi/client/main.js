
define(['../shared/eventDispatcher'], function(EventDispatcher) {

	function Player() {
	
	}
	
	Player.prototype = new EventDispatcher();
	
	return {
		player: new Player()
	};
	
});
