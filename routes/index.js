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

exports.sound = function(req, res) {
	res.render('games/sound');
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

exports.tron = function(req, res) {
	res.render('games/tron');
};

exports.image = function(req, res) {
	res.render('games/image');
};
