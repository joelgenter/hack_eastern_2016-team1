var express = require('express');
var app = express();

app.use(express.static(__dirname + '/public'));

var port = process.env.PORT || 8000;
var server = app.listen(port, function(){
	console.log('listening on', port);
});

var io = require('socket.io')(server);

io.on('connection', function(socket) {
    console.log('User connected');

	socket.on('increment', function(dataObjectFromClient) {
		dataObjectFromClient.theValue++;
		socket.emit('serverHasResponded', dataObjectFromClient);
	});
});







    // socket.on('joinGame', function(tank){
    //     console.log(tank.id + ' joined the game');
    //     var initX = getRandomInt(40, 900);
    //     var initY = getRandomInt(40, 500);
    //     socket.emit('addTank', { id: tank.id, type: tank.type, isLocal: true, x: initX, y: initY, hp: TANK_INIT_HP });
    //     socket.broadcast.emit('addTank', { id: tank.id, type: tank.type, isLocal: false, x: initX, y: initY, hp: TANK_INIT_HP} );

    //     game.addTank({ id: tank.id, type: tank.type, hp: TANK_INIT_HP});
    // });