{
	var express = require('express');
	var app = express();

	app.use(express.static(__dirname + '/public'));

	var port = process.env.PORT || 8000;
	var server = app.listen(port, function(){
		console.log('listening on', port);
	});

	var io = require('socket.io')(server);
}

var PLAYER_LIST = {};
var SOCKET_LIST = {};

/*
* game variables
*/
//represents how far a player will move every time game data is sent
var playerSpeed = 5;
var gameIsStarted = false;
var radiusOfPlayer = 40;
var radiusOfStartShape = 40;
var startShape = {
	exists: false,
	x: null,
	y: null
};
var countingDown = false;
var shapeCollisionHappened = false;
var killerCollisionHappened = false;
var killer = undefined;
var matchTime = 30; //seconds

io.on('connection', function(player) {
	player.id = Math.random();
	console.log("player " + player.id + " has connected.");
	player.isKiller = false;

	var thisPlayer = {
		id: player.id,
		name: "",
		x: 200,
		y: 200,
		mousex: 500,
		mousey: 300,
		color: "#0000FF",
		deaths: 0
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

	player.on('name', function(data) {
		PLAYER_LIST[player.id].name = data.name;
	});

	player.on('disconnect', function() {
		delete PLAYER_LIST[player.id];
		delete SOCKET_LIST[player.id];
		console.log('Player ' + player.id + ' disconnected');
	});

});

/*
* game iteration
*/
setInterval(function() {

	/*
	* start shape collision code
	*/

	//start the game if there are three or more players and game is not started
	if (Object.size(SOCKET_LIST) >= 3 && !gameIsStarted) { 
		startShape = {
			exists: true,
			x: Math.floor((Math.random() * 500) + 1),
			y: Math.floor((Math.random() * 500) + 1)
		};
		for (var i in SOCKET_LIST) {
			var currentPlayer = SOCKET_LIST[i];
			currentPlayer.emit('gameShapeCreated', startShape);
		}
		gameIsStarted = true;
	}

	//checking for collision iwth start shape
	if (gameIsStarted && startShape.exists) {
		for (var i in PLAYER_LIST) {
			var currentPlayer = PLAYER_LIST[i];
			var distanceFromShape = Math.sqrt(Math.pow((currentPlayer.x - startShape.x), 2) + Math.pow((currentPlayer.y - startShape.y), 2));
			if (distanceFromShape <= (radiusOfStartShape + radiusOfPlayer)) {
				shapeCollisionHappened = true;
				currentPlayer.isKiller = true;
				killer = currentPlayer;
				currentPlayer.color = "#FF0000";
				break;
			}
		}

		//send out the collision to all players
		if (shapeCollisionHappened) {
			startShape.exists = false;
			for (var i in SOCKET_LIST) {
				var currentPlayer = SOCKET_LIST[i];
				if (startShape.exists)
					currentPlayer.emit('startShapeCollision', {});
				countingDown = true;
			}
			setTimeout(function() {
				countingDown = false;
				setTimeout(function() {
					killer.color = "#0000FF";
					var lowestDeaths = Number.MAX_VALUE;
					var lowestPlayer = undefined
					for (var i in PLAYER_LIST) {
						var currentPlayer = PLAYER_LIST[i];
						if (!currentPlayer.isKiller) {
							if (currentPlayer.deaths < lowestDeaths) {
								lowestPlayer = currentPlayer;
								lowestDeaths = currentPlayer.deaths;
							}
						}
					}
					killer.isKiller = false;	//reset original killer
					killer = lowestPlayer;
					killer.isKiller = true;	
					killer.color = "#FF0000";
					shapeCollisionHappened = true; 
					countingDown = true;	
				}, matchTime * 1000);
			}, 10000);
			if (!countingDown)
				shapeCollisionHappened = false;
		}
	}

	/*
	* killer collision with player
	*/
	if (gameIsStarted && !countingDown && killer != undefined) {
		for (var i in PLAYER_LIST) {
			var currentPlayer = PLAYER_LIST[i];
			var currentSocket = SOCKET_LIST[currentPlayer.id];
			if (!currentPlayer.isKiller) {
				var distanceFromKiller = Math.sqrt(Math.pow((currentPlayer.x - killer.x), 2) + Math.pow((currentPlayer.y - killer.y), 2));
				if (distanceFromKiller <= (2 * radiusOfPlayer)) {
					killerCollisionHappened = true;
					currentPlayer.deaths++;
					currentPlayer.x = Math.floor((Math.random() * 500) + 1);
					currentPlayer.y = Math.floor((Math.random() * 500) + 1);
					break;
				}
			}
		}
	}


	/*
	* general gamestate managing
	*/ 
	//change positions of players based on their keyDown object
	for (var i in SOCKET_LIST) {
		var currentSocket = SOCKET_LIST[i];
		var currentPlayer = PLAYER_LIST[currentSocket.id];
		if (!(currentPlayer.isKiller && countingDown)) {
			if (currentSocket.keysDown[37]) {//37 is left
				PLAYER_LIST[currentPlayer.id].x -= playerSpeed;
			}
			if (currentSocket.keysDown[39]) {//39 is right
				PLAYER_LIST[currentPlayer.id].x += playerSpeed;
			}
			if (currentSocket.keysDown[38]) {//38 is up
				PLAYER_LIST[currentPlayer.id].y -= playerSpeed;
			}
			if (currentSocket.keysDown[40]) {//40 is down
				PLAYER_LIST[currentPlayer.id].y += playerSpeed;
			}
		}
	}

	//send out the gamestate to each player
	for (var i in SOCKET_LIST) {
		var currentPlayer = SOCKET_LIST[i];
		currentPlayer.emit('gameStateChange', PLAYER_LIST);
	}
}, 40);


/*
* helper functions
*/
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};