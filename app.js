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
app.use(require('less-middleware')({ src: __dirname + '/public' }));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// initialize multi
var options = {
	gameUrlSuffix: '/',
	gameViewSubdir: 'games/'
};

function onPlayerAdded(event) {
	console.log('new player created!', event.player.id);
	event.player.attributes.color = multiModule.color.random();
	setInterval(function () {
		event.player.attributes.color = multiModule.color.random();
	}, 2000);
}

function onSessionCreated(event) {
	console.log('new session created!', event.session.token);
	event.session.on('playerAdded', onPlayerAdded);
}

var multi = multiModule.init(app, server, options);
multi.on('sessionCreated', onSessionCreated);