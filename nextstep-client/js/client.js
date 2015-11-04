var socket = io.connect('/nextstep')
var client = {}
function login(username){
	socket.emit('login', username)
}

socket.on('connect', function(msg){
	console.log('connection successful')
});

socket.on('userid', function(msg){
	console.log('successfully login-ed as ' + msg['username'] + ', userid: ' + msg['userid'])
	client.username = msg['username'];
	client.userid = msg['userid'];
});


function createRoom(roomTitle){
	socket.emit('create_room', roomTitle);
}

socket.on('room_created', function(msg){
	console.log("a room is created: " + msg['room_title'] + "[" + msg['room_id'] + "]");
	if (msg['ownerid'] == client.userid) {
		console.log("you are the owner of the room");
		client.currentRoom = {
			roomId : msg['room_id'],
			roomTitle : msg['room_title'],
			owner : client.userid,
			member : [{
				name : client.username,
				id : client.userid,
			}],
			hashed_member : {},
			status : 'ready',
			exitedMember : []
		}
		client.currentRoom.hashed_member[client.userid] = client.currentRoom.member[0];
	}
});


function joinRoom(roomId){
	socket.emit('join_room', roomId);
}

socket.on('entered_room', function(msg){
	if (msg['userid'] == client.userid) {
		console.log('You entered a room.');
	} else {
		console.log(msg['username'] + " has entered the room.");
		client.currentRoom.member.push({
			name: msg['username'],
			id : msg['userid']
		});
		client.currentRoom.hashed_member[msg['userid']] = client.currentRoom.member[client.currentRoom.member.length-1];
	}
})

socket.on('joined_room', function(msg) {
	console.log("updating room information");
	client.currentRoom = {
		roomId : msg['room_id'],
		roomTitle : msg['room_title'],
		owner : msg['ownerid'],
		member : msg['member'],
		hashed_member : {},
		status : 'ready',
		exitedMember : [],
	}
	for (var i = 0; i < client.currentRoom.member.length; ++i){
		client.currentRoom.hashed_member[client.currentRoom.member[i]['id']] = client.currentRoom.member[i];
	}
})


function startGameSession() {
	socket.emit("start_game");
}

socket.on('initialize', function(msg){
	var data = [];
	// perform initializing job based on terrain
	for (var i = 0; i < client.currentRoom.member.length; ++i) {
		var color = "rgb(" + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + "," + Math.floor(Math.random() * 255) + ')';
		state.player.push(new Player(300 + 300 * i, 0, color, client.currentRoom.member[i].name));
		data.push({
			'x': 300+300*i,
			'y': 0,
			'color':color,
			'username':client.currentRoom.member[i].name,
			'userid':client.currentRoom.member[i].id
		});
		if(client.currentRoom.member[i].id == client.userid) {
			CONST.MAIN_PLAYER = i;
		}
		client.currentRoom.member[i].player = state.player[state.player.length-1];
	}
	state.initialized = true;
	socket.emit('initialize', data);
});


socket.on('initial_values', function(msg){
	if(!state.initialized) {
		for (var i = 0; i < msg.length; ++i) {
			var d = msg[i];
			state.player.push(new Player(d['x'], d['y'], d['color'], d['username']));
			client.currentRoom.hashed_member[d['userid']].player = state.player[state.player.length-1];
			if (d['userid'] == client.userid) {
				CONST.MAIN_PLAYER = i;
			}
		}
	} 
	startGame();
	socket.emit('turn_request');
});

socket.on('turn', function(msg){
	console.log("turn : ", msg['userid']);
	state.currentTurn = msg['userid'];
	if (client.userid == state.currentTurn){
		state.requestToStartCurrentTurn = true;
	} else {
		document.getElementById("clock").innerHTML = "";
	}
});

function setPlayerTurnActive() {
	state.viewMode["LOCKED_PLAYER_VIEW_MODE"] = true;
	state.player[CONST.MAIN_PLAYER].command["USE_ITEM"] = {
		use : false,
	}
	state.player[CONST.MAIN_PLAYER].usedItem = false;
	state.hasMoved = false;
	state.turnStartTime = Date.now();
	state.timePenalty = 0;
	state.usedItem = false;
	state.countdown = setInterval(function() {
		if (state.hasMoved) {
			clearInterval(state.countdown);
			return;
		}
		var now = Date.now();
		if (now - state.turnStartTime >= 20000) {
			state.hasMoved = true;
			state.timePenalty = 20;
			clearInterval(state.countdown);
		} else {
			state.timePenalty = Math.floor(Math.floor(now - state.turnStartTime)/1000);
			document.getElementById("clock").innerHTML = Math.floor(200.0 - (now-state.turnStartTime)/100)/10;
		}
	}, 1000/30);
}


socket.on('snapshot', function(msg) {
	client.currentRoom.hashed_member[msg['userid']].currentSnapshot = msg.snapshot;
	client.currentRoom.hashed_member[msg['userid']].currentSnapshot.obsolete = false;
});

socket.on('player_shoot', function(msg){
	if (msg['userid'] == client.userid) return;
	var m = client.currentRoom.hashed_member[msg['userid']];
	if (m.currentSnapshot) m.currentSnapshot.obsolete = true;
	m.player.x = msg.shoot_info.x;
	m.player.y = msg.shoot_info.y;
	m.player.v = msg.shoot_info.v;
	m.player.orientation = msg.shoot_info.orientation;
	m.player.power = msg.shoot_info.power;
	m.player.dir = msg.shoot_info.dir;
	m.player.angle = msg.shoot_info.angle;
	m.player.thrust = 0;
	m.player.command["SHOOT"] = true;
});


socket.on("player_use_item", function(msg) {
	if (msg['userid'] == client.userid) return;
	var m = client.currentRoom.hashed_member[msg['userid']];
	m.player.command["USE_ITEM"] = {
		'use' : true,
		'which' : msg.item_info.which,
	};
});


function endOfTurn() {
	console.log('end_of_turn');
	socket.emit('end_of_turn', state.timePenalty);
}

function announceDeath() {
	socket.emit('player_death');
}

socket.on('delay_stack', function(msg) {
	client.currentRoom.stack = msg.data;
});

socket.on('exit_room', function(msg) {
	if (client.currentRoom.status == 'playing') {
		client.currentRoom.hashed_member[msg['userid']].player.isAlive = false;
		if (state.currentTurn == msg['userid']) {
			socket.emit('turn_request');
		}
		client.currentRoom.exitedMember.push(msg['userid']);
	} else {
		var tmp = [];
		for(var i = 0; i < client.currentRoom.member.length; ++i){
			if (client.currentRoom.member[i].id != msg['userid']) tmp.push(client.currentRoom.member[i]);
		}
		client.currentRoom.member = tmp;
		delete client.currentRoom.hashed_member[msg['userid']];
	}
});

