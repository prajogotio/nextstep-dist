var socket = io.connect('/nextstep')
var client = {
	roomList : [],
}
function login(username){
	socket.emit('login', username)
}

socket.on('connect', function(msg){
	console.log('connection successful')
});

socket.on('userid', function(msg){
	console.log('successfully login-ed as ' + msg['username'] + ', userid: ' + msg['userid'])
	document.getElementById('lobby_loading').style.setProperty('display', 'none');
	client.username = msg['username'];
	client.userid = msg['userid'];
	document.getElementById('status').innerHTML = "Welcome, <b>" + client.username + "</b>!"
});

socket.on('rooms', function(msg) {
	for (var i = 0; i < msg.length; ++i) {
		client.roomList.push({
			title: msg[i].room_title, 
			id: msg[i].room_id,
			gameType : msg[i]['game_type'],
			roomSize : msg[i]['room_size'],
		});
	}
	renderRooms();
})

function createRoom(roomTitle, gameType, roomSize){
	displayWaitingRoom();
	socket.emit('create_room', {
		room_title: roomTitle,
		game_type: gameType,
		room_size: roomSize});
}

socket.on('room_created', function(msg){
	console.log("a room is created: " + msg['room_title'] + "[" + msg['room_id'] + "]");
	client.roomList.push({
		id : msg['room_id'],
		title : msg['room_title'],
		gameType : msg['game_type'],
		roomSize : msg['room_size'],
	});
	renderRooms();
	if (msg['ownerid'] == client.userid) {
		console.log("you are the owner of the room");
		client.currentRoom = {
			roomId : msg['room_id'],
			roomTitle : msg['room_title'],
			owner : client.userid,
			roomSize : msg['room_size'],
			gameType : msg['game_type'],
			member : [{
				name : client.username,
				id : client.userid,
			}],
			hashed_member : {},
			status : 'ready',
			exitedMember : []
		}
		client.currentRoom.hashed_member[client.userid] = client.currentRoom.member[0];
		renderRoomInfo();
	}
});

function renderRooms() {
	var div = "";
	for (var i = 0; i < client.roomList.length;++i){ 
		div += "<div class='room_item' onclick='joinRoom(" + client.roomList[i].id + ")'><div class='room_header_wrapper'><div class='room_id'>"+client.roomList[i].id+"</div><div class='room_title'>"+client.roomList[i].title+"</div><div style='clear:both;'></div></div><div class='room_type'><i>Type</i>: <b>"+client.roomList[i].gameType+"</b></div><div class='room_size'><i>Size</i>: <b>"+client.roomList[i].roomSize+"</b></div></div>"
	}
	document.getElementById("room_list").innerHTML = div + '<div style="clear:both;"></div>';
}

function joinRoom(roomId){
	displayWaitingRoom();
	socket.emit('join_room', roomId);
}

socket.on('entered_room', function(msg){
	if (msg['userid'] == client.userid) {
		console.log('You entered a room.');
	} else {
		console.log(msg['username'] + " has entered the room.");
		client.currentRoom.member.push({
			name: msg['username'],
			id : msg['userid'],
		});
		client.currentRoom.hashed_member[msg['userid']] = client.currentRoom.member[client.currentRoom.member.length-1];
		renderRoomInfo();
	}
});

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
		roomSize : msg['room_size'],
		gameType : msg['game_type'],
	}
	for (var i = 0; i < client.currentRoom.member.length; ++i){
		client.currentRoom.hashed_member[client.currentRoom.member[i]['id']] = client.currentRoom.member[i];
	}
	renderRoomInfo();
});


function startGameSession() {
	socket.emit("start_game");
}

socket.on('initialize', function(msg){
	var data = [];
	// perform initializing job based on terrain
	var offset = 310;
	var GAP = (2500 - offset * 2)/8;
	var samples = [];
	for (var i = 0; i < 8; ++i) {
		samples.push(i*GAP + offset + (Math.random() - 1) * 30);
	}
	for (var i = 0; i < client.currentRoom.member.length; ++i) {
		var color = "rgb(" + Math.floor(Math.random()*255) + "," + Math.floor(Math.random()*255) + "," + Math.floor(Math.random() * 255) + ')';
		var chosen_i = Math.floor(Math.random() * samples.length);
		if (chosen_i == samples.length) chosen_i = samples.length-1;
		var chosen_x = samples[chosen_i];
		if (chosen_i != samples.length-1) {
			samples[chosen_i] = samples[samples.length-1];
		}
		samples.pop();

		state.player.push(new Player(chosen_x, 0, color, client.currentRoom.member[i].name + (client.currentRoom.member[i].team ? " [" + client.currentRoom.member[i].team + "]": "")));
		data.push({
			'x': chosen_x,
			'y': 0,
			'color':color,
			'username':client.currentRoom.member[i].name + (client.currentRoom.member[i].team ? " [" + client.currentRoom.member[i].team + "]": ""),
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
	document.getElementById('room_layer').style.display = 'none';
	document.getElementById('lobby_layer').style.display = 'none';
	document.getElementById('login_layer').style.display = 'none';
	startGame();
});

socket.on('turn', function(msg){
	state.currentTurn = msg['userid'];
	if (client.userid == state.currentTurn){
		state.startDelay = CONST.START_DELAY;
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
			state.player[CONST.MAIN_PLAYER].thrust = 0;
			state.player[CONST.MAIN_PLAYER].command = {};
			state.timePenalty = 20;
			clearInterval(state.countdown);
		} else {
			state.timePenalty = Math.floor(Math.floor(now - state.turnStartTime)/1000);
			document.getElementById("clock").innerHTML = Math.floor(21.0 - (now-state.turnStartTime)/1000);
		}
	}, 1000/30);
}


socket.on('snapshot', function(msg) {
	var member = client.currentRoom.hashed_member[msg['userid']];
	member.currentSnapshot = msg.snapshot;
	member.currentSnapshot.obsolete = false;
	member.suggestedThrust = Math.abs(member.player.x - member.currentSnapshot.x - 1)/CONST.SNAPSHOT_TIMEFRAME * (member.player.x < member.currentSnapshot.x ? 1 : -1);
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
	socket.emit('end_of_turn', {
		time_penalty: state.timePenalty,
		x: state.player[CONST.MAIN_PLAYER].x,
		y: state.player[CONST.MAIN_PLAYER].y,
		v: state.player[CONST.MAIN_PLAYER].v,
		dir: state.player[CONST.MAIN_PLAYER].dir,
		angle: state.player[CONST.MAIN_PLAYER].angle,
		orientation: state.player[CONST.MAIN_PLAYER].orientation,
		hp: state.player[CONST.MAIN_PLAYER].hp,
	});
}

function announceDeath() {
	socket.emit('player_death');
}

socket.on('delay_stack', function(msg) {
	client.currentRoom.stack = msg.data;
});

socket.on('exit_room', function(msg) {
	if (msg['userid'] == client.userid) {
		displayLobby();
	}
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
		renderRoomInfo();
	}
});

function addSystemMessage(msg) {
	state.messageQueue.push({id: -1, name: 'NEXTSTEP', 'msg': msg});
	renderMessage();
}

function sendMessage(msg) {
	var now = Date.now();
	if (now - state.lastMessageTime < CONST.MESSAGE_FLOOD_LIMIT) {
		state.messageQueue.push({id: -1, name: 'SYSTEM', 'msg' : 'MESSAGE FLOODING'});
		return;
	}
	var text = msg.trim();
	if (text == "") return;
	state.lastMessageTime = now;
	state.messageQueue.push({id: client.userid, name:client.username ,'msg': text});
	socket.emit('message', text);
	state.player[CONST.MAIN_PLAYER].setShoutout(msg);
	renderMessage();
}

socket.on('message', function(msg) {
	if (msg['userid'] == client.userid) return;
	state.messageQueue.push({
		id: msg['userid'], 
		name: client.currentRoom.hashed_member[msg['userid']].name,
		'msg': msg['msg'],
	});
	client.currentRoom.hashed_member[msg['userid']].player.setShoutout(msg['msg']);
	renderMessage();
});

function renderMessage() {
	var disp = "";
	for (var i = Math.max(0, state.messageQueue.length - CONST.MAX_MESSAGE_DISPLAY); i < state.messageQueue.length; ++i){
		disp += "<div style='background-color:rgba(0,0,0,0.6);color:white'><b><i>"+state.messageQueue[i].name + "</i></b>: <span style='font-weight:lighter'>" + state.messageQueue[i].msg + "</span><br/></div>";
	}
	document.getElementById("message_display").innerHTML = disp;
}


function registerListenerForLoginScreen() {
	var loginInput = document.getElementById("login_input");
	loginInput.focus();

	function validateAndSubmit() {
		var username = loginInput.value.trim();
		if (username == "") {
			loginInput.style.setProperty("border", "3px solid red");
			loginInput.focus();
			return;
		}
		login(username);
		document.getElementById("login_layer").style.setProperty("display", "none");
	}

	document.getElementById("login_start_button").addEventListener("click", function() {
		validateAndSubmit();
	});
	document.getElementById("login_input").addEventListener("keydown", function(e) {
		if (e.which == 13) {
			validateAndSubmit();
			e.preventDefault();
			return false;
		}
		if (this.value.length > 20 && e.which != 8) {
			e.preventDefault();
			return false;
		}
	});
}

function exitRoom() {
	socket.emit('exit_room');
	client.currentRoom = {};
}

socket.on('room_destroyed', function(msg) {
	console.log('room['+msg['room_id']+'] destroyed');
	var tmp = [];
	for (var i = 0; i < client.roomList.length; ++i) {
		if (client.roomList[i].id != msg['room_id']) {
			tmp.push(client.roomList[i]);
		}
	}
	client.roomList = tmp;
	renderRooms();
});


socket.on('force_update', function(msg) {
	if (msg['userid'] == client.userid) return;
	var m = client.currentRoom.hashed_member[msg['userid']];
	var p = m.player;
	p.x = msg.state.x;
	p.y = msg.state.y;
	p.v = msg.state.v
	p.hp = msg.state.hp;
	p.dir = msg.state.dir
	p.orientation = msg.state.orientation;
	p.angle = msg.state.angle;
	p.thrust = 0;
	if (m.currentSnapshot) m.currentSnapshot.obsolete = true;
});


function registerListenerForLobbyScreen() {
	var lobbyScreenState = {
		gameType : 'squirmish',
		roomSize : 2,
	};
	var title = document.getElementById('room_title_input');

	document.getElementById('create_room').addEventListener('click', function() {
		document.getElementById('create_room_form').style.setProperty('display', 'block');
		title.focus();
	});

	document.getElementById('create_room_cancel').addEventListener('click', function() {
		document.getElementById('create_room_form').style.setProperty('display', 'none');
		title.blur();
	});

	document.getElementById('create_room_submit').addEventListener('click', function() {
		var t = title.value.trim();
		if (t == "") {
			title.style.border = '5px solid yellow';
			title.focus();
			return;
		}
		title.style.border = 'none';
		title.value = '';
		createRoom(t.substring(0, 40), lobbyScreenState.gameType, lobbyScreenState.roomSize);
		document.getElementById('create_room_form').style.setProperty('display', 'none');
	});

	var buttons = [
		[
			{name:'room_game_squirmish',value:'squirmish'},
			{name:'room_game_team',value:'team'}
		],
		[
			{name:'room_size_2', value:2},
			{name:'room_size_4', value:4},
			{name:'room_size_6', value:6},
			{name:'room_size_8', value:8}
		],
	];

	for (var i = 0; i < buttons.length; ++i) {
		for (var j = 0; j < buttons[i].length; ++j) {
			document.getElementById(buttons[i][j].name).storedValue = buttons[i][j].value;
			document.getElementById(buttons[i][j].name).group = buttons[i];
			document.getElementById(buttons[i][j].name).lobbyScreenState = lobbyScreenState;
			document.getElementById(buttons[i][j].name).addEventListener('click', function() {
				for (var k = 0; k < this.group.length; ++k) {
					document.getElementById(this.group[k].name).className = '';
				}
				this.className = 'chosen';
				if (this.storedValue == 'team' || this.storedValue == 'squirmish') {
					this.lobbyScreenState.gameType = this.storedValue;
				} else {
					this.lobbyScreenState.roomSize = this.storedValue;
				}
			});
		}
	}
}


socket.on('team_member', function(msg) {
	client.currentRoom.hashed_member[msg['userid']].team = msg['team'];
	renderRoomInfo();
});

socket.on('team_info', function(msg){
	console.log(msg);
	for (var i = 0; i < msg.length; ++i) {
		client.currentRoom.hashed_member[msg[i]['userid']].team = msg[i]['team'];
	}
	renderRoomInfo();
});


socket.on("winner", function(msg) {
	endOfGame();
	if (client.currentRoom.gameType == 'team') {
		if (msg['team'] == client.currentRoom.hashed_member[client.userid].team) {
			//
			console.log('your team win');
		} else {
			//
			console.log('your team lose');
		}
	} else {
		if (msg['userid'] == client.userid) {
			//
			console.log('you win!');
		} else {
			//
			console.log('you lose');
		}
	}
});

socket.on('wind_change', function(msg) {
	setWind(msg['angle'], msg['power']);
	addSystemMessage('[NOTICE] WIND HAS CHANGED.');
});

function registerListenerForRoomScreen () {

}

function displayWaitingRoom() {
	document.getElementById('room_layer').style.display = 'block';
	document.getElementById('lobby_layer').style.display = 'none';
	document.getElementById('room_loading').style.display = 'block';
}

function renderRoomInfo() {
	document.getElementById('room_loading').style.display = 'none';
	var div = '';
	for (var i = 0; i < client.currentRoom.member.length; ++i) {
		var m = client.currentRoom.member[i];

		div += '<div class="room_member_list_item"'
		if (m.team) {
			if (m.team == 'B') {
				div += 'style="background-color:rgba(40,211,34,0.5)"';
			}
		}
		div += '><div class="room_member_username">'
		div += '<b>' + m.name + '</b>';
		if (client.currentRoom.owner == m.id) div += " [Room Owner]";
		div += '</div><div class="room_member_team">'
		if (m.team) {
			div += '<b>Team ' + m.team + "</b>";
		}
		div += '</div><div style="clear:both"></div></div>';
	}
	document.getElementById('room_member_list').innerHTML = div;
	document.getElementById('room_title_info').innerHTML = '['+client.currentRoom.roomId+'] '+client.currentRoom.roomTitle;
	document.getElementById('game_type_info').innerHTML = 'Game Type: ' + client.currentRoom.gameType;
	document.getElementById('room_size_info').innerHTML = 'Size: ' + client.currentRoom.member.length + "/" + client.currentRoom.roomSize;
}

function displayLobby() {
	client.currentRoom = {};
	document.getElementById('lobby_layer').style.display = 'block';
	document.getElementById('room_layer').style.display = 'none';
}


socket.on('new_room_owner', function(msg) {
	client.currentRoom.owner = msg['userid'];
	renderRoomInfo();
	
})