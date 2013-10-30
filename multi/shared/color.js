/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }

define(function(require, exports, module) {

	exports.random = function () {
		var color = 'ffff' + (Math.random()*0xFFFFFF<<0).toString(16);
		color = '#' + color.slice(-6);
		return color;
	};

	return exports;

 });