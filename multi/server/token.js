/**
 * @module server/token
 */

 /**
 * @ return Ganzzahl zwischen min und max (inklusive).
 */
function randomInt(min, max) {
	var rand = Math.random() * (max - min + 1);
	rand = Math.floor(rand) + min;
	return rand;
}

function fixedLengthRandomInt(numDigits) {
	var min = Math.pow(10, numDigits - 1);
	var max = min * 10 - 1;
	return randomInt(min, max);
}

/**
 *
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