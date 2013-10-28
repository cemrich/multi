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
exports.numeric = function (minDigits, maxDigits, doubleDigits) {
	minDigits = minDigits || 3;
	maxDigits = maxDigits || 3;
	if (doubleDigits === undefined) {
		doubleDigits = true;
	}

	if (minDigits > maxDigits) {
		throw 'maxDigits has to be greater than or equal to minDigits';
	}

	var numDigits = randomInt(minDigits, maxDigits);
	var rand = 0;
	if (doubleDigits) {
		rand = fixedLengthRandomInt(numDigits);
	} else {
		var numbers = [0,1,2,3,4,5,6,7,8,9];
		for (var i = 0; i < numDigits; i++) {
			var pos = randomInt(0, numbers.length-1);
			var digit = numbers.splice(pos, 1);
			rand += (digit * Math.pow(10, i));
		}
	}
	return rand;
};