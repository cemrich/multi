/* global multi, test, ok */

test('test if main module functions are defined', function (assert) {
	ok(multi, 'multi module is defined');
	ok(multi.init, 'multi init function is defined');
});