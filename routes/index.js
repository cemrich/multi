/**
* @module Routes
*/


/**
 * GET home page.
 */
exports.index = function(req, res){
	res.render('index');
};


// GAMES

exports.example1 = function(req, res){
	res.render('games/example1');
};

exports.symbols = function(req, res) {
	res.render('games/symbols');
};

exports.terminalControllerSnakePlayer = function(req, res) {
	res.render('games/terminalControllerSnake1p/player');
};
exports.terminalControllerSnakePresenter = function(req, res) {
	res.render('games/terminalControllerSnake1p/presenter');
};