/* global process, __dirname */

/*
 * Module dependencies.
 */

var express = require('express'),
	app = express(),
	routes = require('./routes'),
	server = require('http').createServer(app),
	path = require('path'),
	multiModule = require('./multi/server');

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

// routes
app.get('/', routes.index);
// game routes
app.get('/example1', routes.example1);
app.get('/symbols', routes.symbols);
app.get('/snake1p/presenter', routes.terminalControllerSnake1pPresenter);
app.get('/snake1p', routes.terminalControllerSnake1pPlayer);
app.get('/snakemp/presenter', routes.terminalControllerSnakeMpPresenter);
app.get('/snakemp', routes.terminalControllerSnakeMpPlayer);
app.get('/snake1s', routes.serverOnescreenSnake);

server.listen(app.get('port'), function() {
	console.log('Express server listening on port ' + app.get('port'));
});

// initialize multi
function onPlayerAdded(event) {
	console.log('new player created!', event.player.id);
}

function onSessionCreated(event) {
	console.log('new session created!', event.session.token);
	event.session.on('playerAdded', onPlayerAdded);
}

var multi = multiModule.init(server);
multi.on('sessionCreated', onSessionCreated);