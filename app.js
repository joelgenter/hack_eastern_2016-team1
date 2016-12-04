{
	var express = require('express');
	var app = express();

	app.use(express.static(__dirname + '/public'));

	var port = process.env.PORT || 8000;
	var server = app.listen(port, function(){
		console.log('listening on', port);
	});

	// var io = require('socket.io')(server);
}

var PLAYER_LIST = {};
var SOCKET_LIST = {};

//represents how far a player will move every time game data is sent
var playerSpeed = 5;

io.on('connection', function(player) {
	player.id = Math.random();
	console.log("player " + player.id + " has connected.");

	var thisPlayer = {
		id: player.id,
		x: 200,
		y: 200,
		mousex: 500,
		mousey: 300
	};

	player.keysDown = {
		37: false,
		38: false,
		39: false,
		40: false
	};

	player.emit('initializePlayer', thisPlayer);
	SOCKET_LIST[player.id] = player;
	PLAYER_LIST[player.id] = thisPlayer;
	// SOCKET_LIST[player.id] = player;

	//handle the event of a user changing key input
	//@param keysDown the object representing which keys are pressed down
	player.on('keyInput', function(keysDown) {
		SOCKET_LIST[player.id].keysDown = keysDown;

	});

	player.on('disconnect', function() {
		delete PLAYER_LIST[player.id];
		delete SOCKET_LIST[player.id];
		console.log('User ' + player.id + ' disconnected');
	});
});

setInterval(function() {
	for (var i in SOCKET_LIST) {
		var currentPlayer = SOCKET_LIST[i];
		if (currentPlayer.keysDown[37]) //37 is left
			PLAYER_LIST[currentPlayer.id].x -= playerSpeed;
		if (currentPlayer.keysDown[39]) //39 is right
			PLAYER_LIST[currentPlayer.id].x += playerSpeed;
		if (currentPlayer.keysDown[38]) //38 is up
			PLAYER_LIST[currentPlayer.id].y -= playerSpeed;
		if (currentPlayer.keysDown[40]) //40 is down
			PLAYER_LIST[currentPlayer.id].y += playerSpeed;
	}

	for (var i in SOCKET_LIST) {
		var currentPlayer = SOCKET_LIST[i];
		currentPlayer.emit('gameStateChange', PLAYER_LIST);
	}
}, 40);
