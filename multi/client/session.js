
define(function(require, exports, module) {

	var EventDispatcher = require('../shared/eventDispatcher');

	exports.Session = function () {
		
	};

	exports.Session.prototype = new EventDispatcher();
	return exports.Session;

});