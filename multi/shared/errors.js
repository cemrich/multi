/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


/**
 * Collection of Error classes that multi uses to communicate that
 * something went wrong.
 * @private
 * @module
 */
define(function(require, exports, module) {

	var util = require('./util');

	/**
	 * The built in error object.
	 * @external Error
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
	 */


	/**
	 * @classdesc The session you were looking for was not found
	 * on the server. Most likely the token has been misspelled.
	 * @class
	 * @mixes external:Error
	 */
	exports.NoSuchSessionError = function () {
		Error.call(this, 'the requested session does not exist');
	};
	util.inherits(exports.NoSuchSessionError, Error);


	/**
	 * @classdesc The session you wanted to create already exists.
	 * This can happen when you have configured a static session 
	 * token inside the {@link SessionOptions} and are trying to 
	 * create this session more than once. Closing any open tabs
	 * connected to this session may solve your problem.
	 * @class
	 * @mixes external:Error
	 */
	exports.TokenAlreadyExistsError = function () {
		Error.call(this, 'a session with this token does already exist');
	};
	util.inherits(exports.TokenAlreadyExistsError, Error);


	/**
	 * @classdesc The session you wanted to join already has enough
	 * players. This happens when there are as many or more players 
	 * connected as defined in 
	 * {@link module:client/session~Session#maxPlayerAllowed maxPlayerAllowed}.
	 * @class
	 * @mixes external:Error
	 */
	exports.SessionFullError = function () {
		Error.call('the requested session is full');
	};
	util.inherits(exports.SessionFullError, Error);


	/**
	 * @classdesc You are not able to create or join a session
	 * because there is no connection to the server. Maybe the
	 * socket.io settings are wrong or the internet connection
	 * dropped.
	 * @class
	 * @mixes external:Error
	 */
	exports.NoConnectionError = function () {
		Error.call(this, 'no connection to server');
	};
	util.inherits(exports.NoConnectionError, Error);


	/**
	 * @classdesc There could be no valid session token extracted
	 * from the url. You may want to check if the current url has
	 * the format http://myGameUrl/some/game#myToken
	 * @class
	 * @mixes external:Error
	 */
	exports.NoSessionTokenFoundError = function () {
		Error.call(this, 'no session token found in url');
	};
	util.inherits(exports.NoSessionTokenFoundError, Error);


	return exports;

 });