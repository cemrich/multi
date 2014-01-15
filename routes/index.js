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

exports.snakePlayer = function(req, res) {
	res.render('games/snake/player');
};
exports.snakePresenter = function(req, res) {
	res.render('games/snake/presenter');
};

exports.snakeMpPlayer = function(req, res) {
	res.render('games/snakeMp/player');
};
exports.snakeMpPresenter = function(req, res) {
	res.render('games/snakeMp/presenter');
};

exports.tron = function(req, res) {
	res.render('games/tron');
};

exports.image = function(req, res) {
	res.render('games/image');
};
