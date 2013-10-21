/**
* Entry point for the server side multi library for developing
* multiscreen games.
* Call {@link module:multi.init|init()} to initialize this library.
* @module multi
*/

/**
 * Call this once to initialize the multi framework.
 * @public
 */
function init(app, options) {

	// adding route for first game
	app.get(options.gameUrlSuffix + 'example1', function(req, res) {
		res.render(options.gameViewSubdir + 'example1');
	});

};

module.exports = init;