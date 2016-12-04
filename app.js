var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 8000;
var server = app.listen(port, function(){
	console.log('listening on', port);
});

var io = require('socket.io')(server);

var PLAYER_LIST = {};

io.on('connection', function(player) {
	player.id = Math.random();
	var thisPlayer = {
		id: player.id,
		x: 200,
		y: 200,
		mousex: 500,
		mousey: 300
	};
	console.log(thisPlayer);
	player.emit('initializePlayer', thisPlayer);
	/*
	player.x = 0;
	player.y = 0;
	*/
	PLAYER_LIST[player.id] = player;

    console.log('User ' + player.id + ' connected');

	for (var i in PLAYER_LIST) {
		player = PLAYER_LIST[i];
	}

	player.on('sendPlayer', function(playerObj) {
		for (var i in PLAYER_LIST) {
			player = PLAYER_LIST[i];
			player.emit('receivePlayer', playerObj);
		}
	});

	player.on('disconnect', function() {
		delete PLAYER_LIST[player.id];
		console.log('User ' + player.id + ' disconnected');
	});
/*
	player.on('increment', function(dataObjectFromClient) {
		dataObjectFromClient.theValue++;
		player.emit('serverHasResponded', dataObjectFromClient);
	});
	*/
});
