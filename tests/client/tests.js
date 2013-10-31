requirejs.config({
	baseUrl: '../../public/js/lib/'
});


requirejs(['multi', 'http://localhost/socket.io/socket.io.js'], function (multiModule, _) {

	test("test multi setup", function() {
		ok(multiModule, "multiModule is defined");
		ok(multiModule.color, "multiModule.color is defined");
	});

	// all modules & tests loaded, so begin testing
	QUnit.start();

});
