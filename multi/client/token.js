/**
* Util functions and classes to make working with session tokens a bit
* easier.
* @module client/token
*/

define(function(require, exports, module) {

	var Q = require('../lib/q');
	var errors = require('../shared/errors');

	/**
	 * Extracts the session token from the current URL. At the moment it has to 
	 * follow the format "http://path.to/my/server#myToken".
	 * @return {external:Promise} On success the promise will be resolved with 
	 * the parsed session token. On error it will be rejected with a 
	 * {@link module:shared/errors.NoSuchSessionError NoSuchSessionError}.
	 * @see module:client/multi~Multi#autoJoinSession
	 */
	exports.extractTokenFromURL = function () {
		var sessionToken = window.location.hash.substring(1);

		if (sessionToken === undefined || sessionToken === '') {
			return Q.reject(new errors.NoSessionTokenFoundError());
		} else {
			return Q.resolve(sessionToken);
		}
	};

});