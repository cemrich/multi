/* jshint globalstrict: true */
/* global exports */
'use strict';

/**
 * Collects some helper functions for generating
 * random tokens that can be used for identifying
 * sessions. You can configure the kind of token
 * your session should use with the
 * {@link SessionOptions}. <br><br>
 * If you would like to use your own token function
 * you can add it to this module before initializing
 * the rest of the framework:
 * @example
 * // load module and add your function
 * var tokenModule = require('./multi/server/token');
 * tokenModule.myToken = function (prefix) {
 *   return prefix + Math.floor(Math.random() * 100);
 * };
 * 
 * // work with multi
 * var multi = multiModule.init(server);
 * multi.on('sessionCreated', onSessionCreated);
 * 
 * 
 * // on client side do this:
 * var sessionOptions = {
 *   token: {
 *     func: 'myToken',       // name of your function
 *     args: [ 'mySession' ]  // arguments for your function
 *   }
 * };
 * multi.createSession(sessionOptions);
 * 
 * @module server/token
 */

 /**
 * @param {integer} min  smallest allowed number (inclusive)
 * @param {integer} max  biggest allowed number (inclusive)
 * @return {integer}     number between min and max (inclusive).
 */
function randomInt(min, max) {
	var rand = Math.random() * (max - min + 1);
	rand = Math.floor(rand) + min;
	return rand;
}

/**
 * Generates a random string containing only numeric digits.
 * @param {integer} [minLength=3]     minimal number of digits
 * @param {integer} [maxLength=3]     maximal number of digits
 * @param {integer} [digitCount=10]    number of digits that should be used for 
 generating the number. By default all 10 digits are used.
 * @param {boolean} [doubleDigits=true]  when false, every digit of the random number
 will be unique inside the number
 * @returns {string} random integer
 */
exports.numeric = function (minLength, maxLength, digitCount, doubleDigits, sorted) {
	minLength = minLength || 3;
	maxLength = maxLength || 3;
	digitCount = digitCount || 10;
	if (doubleDigits === undefined) {
		doubleDigits = true;
	}
	if (sorted === undefined) {
		sorted = false;
	}

	if (minLength > maxLength) {
		throw 'maxLength has to be greater than or equal to minLength';
	}

	var length = randomInt(minLength, maxLength);
	var rand = '';
	var i, pos;
	var digits = '0123456789'.split('').slice(0, digitCount);
	if (doubleDigits) {
		for (i = 0; i < length; i++) {
			pos = randomInt(0, digits.length-1);
			rand += digits[pos];
		}
	} else {
		for (i = 0; i < length; i++) {
			pos = randomInt(0, digits.length-1);
			rand += digits.splice(pos, 1);
		}
	}
	if (sorted) {
		rand = rand.split('').sort().join('');
	}
	return rand;
};

/**
 * Generates a random numeric string which can be used for authentication 
 * via symbol pattern field (each symbol one digit, only unique digits).
 * @param {integer} [minSymbols=1]   minimal number of selected symbols
 * @param {integer} [maxSymbols=4]   maximal number of selected symbols
 * @param {integer} [symbolCount=9]  number of digits that should be used for 
 generating the number. By default all 9 digits are used for using it with a 
 3x3 symbol field.
 * @returns {string} random numeric string
 */
exports.symbolPattern = function (minSymbols, maxSymbols, symbolCount) {
	minSymbols = minSymbols || 1;
	maxSymbols = maxSymbols || 4;
	symbolCount = symbolCount || 9;
	return exports.numeric(minSymbols, maxSymbols, symbolCount, false, true);
};

/**
 * Simply returns the given token string. Useful only when only one
 * session with a known token should exist, p.e. when running multi 
 * as a terminal application.
 * @param {string} value  the token you want to be returned
 * @return {string} the token you passed in
 */
exports.staticToken = function (value) {
	return value || '';
};