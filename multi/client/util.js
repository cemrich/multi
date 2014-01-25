/**
* Collection of util functions and required polyfills.
* @module client/util
*/

define(function(require, exports, module) {
	'use strict';

	/**
	* Inherit the prototype methods from one constructor into another.
	* <br/><br/>
	* From the socket.io util package. See {@link https://github.com/LearnBoost/socket.io-client}
	*
	* @param {function} ctor Constructor function which needs to inherit the
	* prototype.
	* @param {function} superCtor Constructor function to inherit prototype from.
	* @example
	* var ChildClass = function () {
	*   SuperClass.apply(this, arguments);
	*   this.name = 'childClass';
	* };
	* util.inherits(ChildClass, SuperClass);
	*/
	exports.inherits = require('socket.io').util.inherit;


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
			if (typeof this !== 'function') {
				// closest thing possible to the ECMAScript 5 internal IsCallable function
				throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
			}

			var aArgs = Array.prototype.slice.call(arguments, 1);
			var fToBind = this;
			var FNOP = function () {};
			var fBound = function () {
				var isValid = this instanceof FNOP && oThis;
				return fToBind.apply(isValid ? this : oThis,
					aArgs.concat(Array.prototype.slice.call(arguments))
				);
			};

			FNOP.prototype = this.prototype;
			fBound.prototype = new FNOP();

			return fBound;
		};
	}

});