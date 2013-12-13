/* global exports */

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

exports.symbols = function(req, res) {
	res.render('games/symbols');
};

exports.terminalControllerSnake1pPlayer = function(req, res) {
	res.render('games/terminalControllerSnake1p/player');
};
exports.terminalControllerSnake1pPresenter = function(req, res) {
	res.render('games/terminalControllerSnake1p/presenter');
};

exports.terminalControllerSnakeMpPlayer = function(req, res) {
	res.render('games/terminalControllerSnakeMp/player');
};
exports.terminalControllerSnakeMpPresenter = function(req, res) {
	res.render('games/terminalControllerSnakeMp/presenter');
};

exports.serverOnescreenSnake = function(req, res) {
	res.render('games/serverOnescreenSnake');
};

exports.image = function(req, res) {
	res.render('games/image');
};
