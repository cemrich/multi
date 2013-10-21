
define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');

	exports.Player = function () {
		
	};

	exports.Player.prototype = new EventDispatcher();
	return exports.Player;

});