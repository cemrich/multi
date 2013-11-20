/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }

/**
* Collection of util functions.
* @module shared/util
* @private
* @ignore
*/

define(function(require, exports, module) {

	/**
	* Inherit the prototype methods from one constructor into another.
	* <br/><br/>
	* From the node.js util package. See {@link https://github.com/joyent/node/blob/master/lib/util.js#L566 https://github.com/joyent/node/blob/master/lib/util.js}
	*
	* @param {function} ctor Constructor function which needs to inherit the
	* prototype.
	* @param {function} superCtor Constructor function to inherit prototype from.
	*/
	exports.inherits = function(ctor, superCtor) {
		ctor.prototype = Object.create(superCtor.prototype, {
			constructor: {
				value: ctor,
				enumerable: false,
				writable: true,
				configurable: true
			}
		});
	};

});