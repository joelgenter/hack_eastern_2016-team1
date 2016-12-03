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
	player.x = 0;
	player.y = 0;
	PLAYER_LIST[player.id] = player;

    console.log('User ' + player.id + ' connected');

	for (var i in PLAYER_LIST) {
		var player = PLAYER_LIST[i];
	}

	player.on('sendText', function(data) {
		for (var i in PLAYER_LIST) {
			var player = PLAYER_LIST[i];
			player.emit('newText', data);
			console.log('made it this far');
		}
	});

/*
	player.on('increment', function(dataObjectFromClient) {
		dataObjectFromClient.theValue++;
		player.emit('serverHasResponded', dataObjectFromClient);
	});
	*/
});

// setInterval(function() {
// 	for (var i in PLAYER_LIST) {
// 		var player = PLAYER_LIST[i];
// 		player.x++;
// 		player.y++;
// 		player.emit('newPosition', {
// 			x: player.x,
// 			y: player.y
// 		});
// 	}
// }, 1000/25);

