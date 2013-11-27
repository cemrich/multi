/* global errors, test, ok */

test('test prototype chain', function (assert) {
	ok(errors, 'errors module is defined');
	ok(new errors.MultiError() instanceof Error, 'MultiError is instance of Error');
	for (var i in errors) {
		var instance = new errors[i]();
		ok(instance instanceof errors.MultiError, i + ' is instance of MultiError');
	}
});
