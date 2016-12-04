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
	player.emit('initializePlayer', thisPlayer);
	console.log("Player " + thisPlayer)

	PLAYER_LIST[player.id] = player;

	/*
	* testing new 
	*/
	player.on('playerTransfer', function(playerObj) {
		for (var i in PLAYER_LIST) {
			var player = PLAYER_LIST[i];
			player.emit('playerTransfer', playerObj);
		}
	})


	for (var i in PLAYER_LIST) {
		player = PLAYER_LIST[i];
	}

	/*
	* testing new 
	*/
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
});
