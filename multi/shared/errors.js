/* 
* To use this with require.js AND the node.js module system (on server and client side).
* see https://github.com/jrburke/amdefine
*/
if (typeof define !== 'function') { var define = require('amdefine')(module); }


/**
 * Collection of Error classes that multi uses to communicate that
 * something went wrong.
 * @private
 * @module shared/errors
 */
define(function(require, exports, module) {
	'use strict';

	var util = require('util');

	/**
	 * The built in error object.
	 * @external Error
	 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error}
	 */

	/**
	 * @classdesc Generic framewok error.
	 * @class
	 * @memberof module:shared/errors
	 * @mixes external:Error
	 */
	var MultiError = exports.MultiError = function () {
		var err = Error.apply(this, arguments);
		this.stack = err.stack;
		this.message = err.message;
	};
	util.inherits(MultiError, Error);

	/**
	 * @classdesc The session you were looking for was not found
	 * on the server. Most likely the token has been misspelled.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.NoSuchSessionError = function () {
		MultiError.call(this, 'the requested session does not exist');
	};
	util.inherits(exports.NoSuchSessionError, MultiError);


	/**
	 * @classdesc The session you wanted to create already exists.
	 * This can happen when you have configured a static session 
	 * token inside the {@link SessionOptions} and are trying to 
	 * create this session more than once. Closing any open tabs
	 * connected to this session may solve your problem.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.TokenAlreadyExistsError = function () {
		MultiError.call(this, 'a session with this token does already exist');
	};
	util.inherits(exports.TokenAlreadyExistsError, MultiError);


	/**
	 * @classdesc The session you wanted to join already has enough
	 * players. This happens when there are as many or more players 
	 * connected as defined in 
	 * {@link module:client/session~Session#maxPlayerAllowed maxPlayerAllowed}.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.SessionFullError = function () {
		MultiError.call('the requested session is full');
	};
	util.inherits(exports.SessionFullError, MultiError);


	/**
	 * @classdesc You are not able to create or join a session
	 * because there is no connection to the server. Maybe the
	 * socket.io settings are wrong or the internet connection
	 * dropped.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.NoConnectionError = function () {
		MultiError.call(this, 'no connection to server');
	};
	util.inherits(exports.NoConnectionError, MultiError);


	/**
	 * @classdesc There could be no valid session token extracted
	 * from the url. You may want to check if the current url has
	 * the format http://myGameUrl/some/game#myToken
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.NoSessionTokenFoundError = function () {
		MultiError.call(this, 'no session token found in url');
	};
	util.inherits(exports.NoSessionTokenFoundError, MultiError);


	/**
	 * @classdesc New players are currently not allowed to join
	 * this session. Maybe someone called 
	 * {@link module:client/session~Session#disablePlayerJoining}.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.JoiningDisabledError = function () {
		MultiError.call(this, 'player joining is currently disabled');
	};
	util.inherits(exports.JoiningDisabledError, MultiError);


	/**
	 * @classdesc The script name you configured in the {@link SessionOptions}
	 *  is not valid.
	 * @class
	 * @mixes module:shared/errors.MultiError
	 */
	exports.ScriptNameNotAllowedError = function () {
		MultiError.call(this, 'only letters (A-Za-z) and digits (0-9) are allowed for sessionOptions.scriptName');
	};
	util.inherits(exports.ScriptNameNotAllowedError, MultiError);


	return exports;

});