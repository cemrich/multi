/* global process, __dirname */

/*
 * Module dependencies.
 */

var express = require('express'),
	app = express(),
	routes = require('./routes'),
	server = require('http').createServer(app),
	path = require('path'),
	multiModule = require('./multi/server'),
	tokens = require('./multi/server/token');

// all environments
app.set('port', process.env.PORT || 80);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.favicon('public/favicon.ico'));
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
	app.use(express.errorHandler());
}

app.use(function(req, res, next) {
	if (typeof req.header('referrer') === 'undefined') {
		res.redirect('/', 301);
	} else {
		res.status(404);
	}
	next();
});

// routes
app.get('/', routes.index);
// game routes
app.get('/symbols', routes.symbols);
app.get('/sound', routes.sound);
app.get('/snake/presenter', routes.snakePresenter);
app.get('/snake', routes.snakePlayer);
app.get('/snakemp/presenter', routes.snakeMpPresenter);
app.get('/snakemp', routes.snakeMpPlayer);
app.get('/tron', routes.tron);
app.get('/image', routes.image);
app.get('/avatar', routes.avatar);

server.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

// initialize multi

// token generator for sound example
tokens.soundToken = function (halfLength) {
	var token = '';
	for (var i = 0; i < halfLength; i++) {
		token += Math.random() < 0.5 ? '02' : '12';
	}
	return token;
};

function onSessionCreated(event) {
	console.log('new session created!', event.session.token);
}

var multi = multiModule.init(server);
multi.on('sessionCreated', onSessionCreated);