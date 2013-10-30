requirejs.config({
	baseUrl: '../../public/js/lib/'
});


requirejs(['multi', 'http://localhost/socket.io/socket.io.js'], function (multi, _) {

	test("test multi setup", function() {
		ok(multi, "multi is defined");
	});

	// all modules & tests loaded, so begin testing
	QUnit.start();

});
