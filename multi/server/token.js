/**
 * Collects some helper functions for generating
 * random tokens that can be used for identifying
 * things.
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
 * Generates a random integer.
 * @param {integer} [minLength=3]     minimal number of digits
 * @param {integer} [maxLength=3]     maximal number of digits
 * @param {integer} [digitCount=10]    number of digits that should be used for 
 generating the number. By default all 10 digits are used.
 * @param {boolean} [doubleDigits=true]  when false, every digit of the random number
 will be unique inside the number
 * @returns {integer} random integer
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
		rand = parseInt(rand.split('').sort().join(''), 10);
	}
	return rand;
};