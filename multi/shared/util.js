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

	/* Function.bind-polyfill from 
	* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function/bind#Compatibility
	* This is needed to support older browsers without proper
	* ECMAScript 5.1 support. Especially PhantomJS that's running
	* the tests of this project will throw errors without this
	* polyfill.
	* See https://groups.google.com/forum/#!msg/phantomjs/r0hPOmnCUpc/uxusqsl2LNoJ
	*/
	if (!Function.prototype.bind) {
		Function.prototype.bind = function (oThis) {
			if (typeof this !== "function") {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError("Function.prototype.bind - what is trying to be bound is not callable");
			}

			var aArgs = Array.prototype.slice.call(arguments, 1), 
					fToBind = this, 
					fNOP = function () {},
					fBound = function () {
						return fToBind.apply(this instanceof fNOP && oThis
																	 ? this
																	 : oThis,
																 aArgs.concat(Array.prototype.slice.call(arguments)));
					};

			fNOP.prototype = this.prototype;
			fBound.prototype = new fNOP();

			return fBound;
		};
	}

});