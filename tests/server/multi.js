/* global multiModule, test, ok */

var app = require('express')();
var server = require('http').createServer(app);
var multi = multiModule.init(server);


test('test if main module functions are defined', function (assert) {
	ok(multiModule, 'multi module is defined');
	ok(multiModule.init, 'multi init function is defined');
	ok(multi, 'multi instance can be created');
});
