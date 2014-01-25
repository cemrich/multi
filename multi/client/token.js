/**
* Util functions and classes to make working with session tokens a bit
* easier.
* @module client/token
*/

define(function(require, exports, module) {
	'use strict';

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


	/**
	 * Small helper class for managing symbol fields to connect to existing
	 * sessions. The user can click on each symbol to toggle its state - all
	 * activated symbols will then build the session token.<br>
	 * -  -  #<br>
	 * #  -  -<br>
	 * -  -  #<br>
	 * for example will convert to the token '238' - the indices of all activated
	 * symbols.
	 * @param {integer} symbolCount  number of symbols you want to have
	 *  in your grid
	 *  
	 * @example
	 * var symbols = SymbolArray(9);
	 *
	 * function onIconClick(event) {
	 *   var icon = $(event.currentTarget);
	 *   var isActive = symbolArray.toggle(icon.index());
	 *   var classes = isActive ? 'active' : 'inactive';
	 *   icon.attr('class', classes);
	 * }
	 *
	 * // .... later on:
	 * var token = symbols.toToken();
	 * multi.joinSession(token);
	 */
	exports.SymbolArray = function (symbolCount) {
		this.symbols = new Array(symbolCount);
	};

	/**
	 * Toggles the selected state of the symbol at the given index.
	 * @param  {integer} position index of the symbol you want to change
	 * @return {boolean}         true if the symbol at the given index
	 *  is now selected, false otherwise
	 */
	exports.SymbolArray.prototype.toggle = function (position) {
		this.symbols[position] =! this.symbols[position];
		return this.symbols[position];
	};

	/**
	 * @return {string} the token representation of this symbol array
	 */
	exports.SymbolArray.prototype.toToken = function () {
		return this.symbols.reduce(function (x, y, index) {
			return y ? x + index : x;
		}, '');
	};

});