(function() {
var socket = io.connect('wss://'+location.host+'/nextstep');
var client = {
	roomList : [],
	terrainChoices : [
		'lindbulm',
		'herbestus',
		'hearow',
		'crepes',
	],
	listenerRegistered : false,
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
			exitedMember : [],
		}
		client.currentRoom.hashed_member[client.userid] = client.currentRoom.member[0];
		renderRoomInfo();
	}
});

function renderRooms() {
	var list = document.getElementById("room_list");
	list.innerHTML = "";
	for (var i = 0; i < client.roomList.length;++i){ 
		var cur = document.createElement('div');

		cur.className='room_item';
		cur.innerHTML = "<div class='room_header_wrapper'><div class='room_id'>"+client.roomList[i].id+"</div><div class='room_title'>"+client.roomList[i].title+"</div><div style='clear:both;'></div></div><div class='room_type'><i>Type</i>: <b>"+client.roomList[i].gameType+"</b></div><div class='room_size'><i>Size</i>: <b>"+client.roomList[i].roomSize+"</b></div>";
		list.appendChild(cur);
		cur.onclick = (function(j) {
			return function(e) {
				joinRoom(client.roomList[j].id);
			}
		})(i);
	}
	var clearDiv = document.createElement('div');
	clearDiv.style.setProperty('clear', 'both');
	list.appendChild(clearDiv);
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
	sendMessage(" **starting game** ");
	socket.emit("start_game");
}

socket.on('initialize', function(msg){
	var data = {
		player: [],
		terrain: null,
	}
	// perform initializing job based on terrain
	var offset = 350;
	var GAP = (2500 - offset * 2)/8;
	var samples = [];
	for (var i = 0; i < 8; ++i) {
		samples.push(i*GAP + offset + (Math.random() - 1) * 10);
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
		data.player.push({
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
	data.terrain = terrainRandomPick();
	state.terrainAssetName = data.terrain;
	state.initialized = true;
	
	socket.emit('initialize', data);
});


function terrainRandomPick() {
	var index = Math.floor(Math.random() * client.terrainChoices.length);
	if (index == client.terrainChoices.length) {
		index--;
	}
	return client.terrainChoices[index];
}

socket.on('initial_values', function(msg){
	if(!state.initialized) {
		for (var i = 0; i < msg.player.length; ++i) {
			var d = msg.player[i];
			state.player.push(new Player(d['x'], d['y'], d['color'], d['username']));
			client.currentRoom.hashed_member[d['userid']].player = state.player[state.player.length-1];
			if (d['userid'] == client.userid) {
				CONST.MAIN_PLAYER = i;
			}
		}
		state.terrainAssetName = msg.terrain;
	} 
	document.getElementById('room_layer').style.display = 'none';
	document.getElementById('lobby_layer').style.display = 'none';
	document.getElementById('login_layer').style.display = 'none';
	document.getElementById('room_start_game_button').innerHTML = 'Start Game';
	document.getElementById('room_start_game_button').style.cursor = 'pointer';
	client.currentRoom.starting = false;
	startGame();
});

socket.on('turn', function(msg){
	if (!state.isGamePlaying) return;
	state.currentTurn = msg['userid'];
	if (client.userid == state.currentTurn){
		state.startDelay = CONST.START_DELAY;
		state.requestToStartCurrentTurn = true;
	} else {
		document.getElementById("clock").innerHTML = "";
		focusOnPlayer(msg['userid']);
	}
});

function focusOnPlayer(userid){
	var p = client.currentRoom.hashed_member[userid].player;
	state.viewOffset[0] = -p.x + state.display.width/2;
	state.viewOffset[1] = -p.y + state.display.height/2;
}

function setPlayerTurnActive() {
	state.viewMode["LOCKED_PLAYER_VIEW_MODE"] = true;
	client.turnEnded = false;
	state.endOfTurnDelay = CONST.END_OF_TURN_DELAY;
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
	if (state.snapshotBlocked || !state.isGamePlaying) return;
	var member = client.currentRoom.hashed_member[msg['userid']];
	if(state.bullets.length == 0 && state.explosions.length == 0) {
		member.currentSnapshot = msg.snapshot;
		member.currentSnapshot.obsolete = false;
		member.suggestedThrust = Math.abs(member.player.x - member.currentSnapshot.x - 1)/CONST.SNAPSHOT_TIMEFRAME * (member.player.x < member.currentSnapshot.x ? 1 : -1);
	}
});

socket.on('player_shoot', function(msg){
	if (!state.isGamePlaying) return;
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
	if (!state.isGamePlaying) return;
	if (msg['userid'] == client.userid) return;
	var m = client.currentRoom.hashed_member[msg['userid']];
	m.player.command["USE_ITEM"] = {
		'use' : true,
		'which' : msg.item_info.which,
	};
});


function endOfTurn() {
	if (!state.isGamePlaying) return;
	if (client.turnEnded) return;
	console.log('my end_of_turn');
	client.turnEnded = true;
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
	if(client.deathAnnounced) return;
	client.deathAnnounced = true;
	socket.emit('player_death');
}

socket.on('delay_stack', function(msg) {
	if (!state.isGamePlaying) return;
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
		removeMemberFromRoomList(msg['userid']);
		renderRoomInfo();
	}
});

function removeMemberFromRoomList(userid) {
	var tmp = [];
	for(var i = 0; i < client.currentRoom.member.length; ++i){
		if (client.currentRoom.member[i].id != userid) {
			tmp.push(client.currentRoom.member[i]);
		}
	}
	client.currentRoom.member = tmp;
	delete client.currentRoom.hashed_member[userid];
}

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
	if (state.isGamePlaying) state.player[CONST.MAIN_PLAYER].setShoutout(msg);
	renderMessage();
	renderRoomChatMessage();
}

socket.on('message', function(msg) {
	if (msg['userid'] == client.userid) return;
	state.messageQueue.push({
		id: msg['userid'], 
		name: client.currentRoom.hashed_member[msg['userid']].name,
		'msg': msg['msg'],
	});
	if (state.isGamePlaying) client.currentRoom.hashed_member[msg['userid']].player.setShoutout(msg['msg']);
	renderMessage();
	renderRoomChatMessage();
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
	client.currentRoom = null;
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
	for (var i = 0; i < msg.length; ++i) {
		client.currentRoom.hashed_member[msg[i]['userid']].team = msg[i]['team'];
	}
	renderRoomInfo();
});

function endOfGame() {
	clearInterval(state.countdown);
	for (var i = 0; i < client.currentRoom.member.length; ++i) {
		if (client.currentRoom.member.currentSnapshot){
			client.currentRoom.member.currentSnapshot.obsolete = true;
		}
	}
	state.isGamePlaying = false;
	var v = document.getElementById('result_notif_box');
	var w = document.getElementById('result_label');
	if (state.gameResult == 'win'){
		v.style.setProperty('background-color', 'rgba(21,211,131,0.8)');
		if (client.currentRoom.gameType == 'team') {
			w.innerHTML = "Your Team WON!";
		} else {
			w.innerHTML = "You WON!";
		}
	} else {
		v.style.setProperty('background-color','rgba(211,31,31,0.8)');
		if (client.currentRoom.gameType == 'team') {
			w.innerHTML = "Your Team Lost.";
		} else {
			w.innerHTML = "You Lost.";
		}
	}
	v.style.display = 'block';
}


socket.on("winner", function(msg) {
	if(!state.isGamePlaying) return;
	if (client.currentRoom.gameType == 'team') {
		if (msg['team'] == client.currentRoom.hashed_member[client.userid].team) {
			state.gameResult = 'win';
		} else {
			state.gameResult = 'lose';
		}
	} else {
		if (msg['userid'] == client.userid) {
			state.gameResult = 'win';
		} else {
			state.gameResult = 'lose';
		}
	}
	endOfGame();
	
});

socket.on('wind_change', function(msg) {
	if (!state.isGamePlaying) return;
	state.requestWindChange = true;
	state.requestedWindAngle = msg['angle']; 
	state.requestedWindPower = msg['power'];
	console.log('wind_change!')
});

function registerListenerForRoomScreen () {
	document.getElementById('room_start_game_button').addEventListener('click', function() {
		if (client.currentRoom.starting) return;
		client.currentRoom.starting = true;
		document.getElementById('room_start_game_button').innerHTML = 'Starting...';
		document.getElementById('room_start_game_button').style.cursor = 'default';
		startGameSession();
	});

	document.getElementById('room_swap_team_button').addEventListener('click', function() {
		swapTeam();
	});

	document.getElementById("waiting_room_chat_input").addEventListener("keydown", function(e) {
		if (e.which == 13) {
			sendMessage(document.getElementById("waiting_room_chat_input").value);
			document.getElementById("waiting_room_chat_input").value = "";
			e.stopPropagation();
			return false;
		}
		if (document.getElementById("waiting_room_chat_input").value.length >= 100 && e.which != 8) {
			e.preventDefault();
			return false;
		} 
	});

	document.getElementById('result_confirmation_button').addEventListener('click', function() {
		document.getElementById('result_notif_box').style.display = 'none';
		displayWaitingRoom();
		renderRoomInfo();
	});

	document.getElementById('room_exit_room_button').addEventListener('click', function() {
		exitRoom();
		displayLobby();
	});
}

function swapTeam() {
	var newTeam = (client.currentRoom.hashed_member[client.userid].team == 'A' ? 'B' : 'A');
	socket.emit('join_team', newTeam);
}


function displayWaitingRoom() {
	document.getElementById('room_layer').style.display = 'block';
	document.getElementById('lobby_layer').style.display = 'none';
	document.getElementById('room_loading').style.display = 'block';
	document.getElementById('waiting_room_chat_input').focus();
	if (client.currentRoom) {
		client.currentRoom.status = 'ready';
		for (var i = 0; i < client.currentRoom.exitedMember.length; ++i) {
			removeMemberFromRoomList(client.currentRoom.exitedMember[i]);
		}
		client.currentRoom.exitedMember = [];
	}
	clearRoomGameState();
}

function clearRoomGameState() {
	clearInterval(state.timer);
	client.turnEnded = false;
	client.deathAnnounced = false;
	client.snapshotBlocked = false;
	state.player = [];
	state.viewMode = {};
	state.viewOffset = [0, 0];
	state.terrainOffset = [250, 0];
	state.powerBar = {
			power : 0,
			marker : 0,
		};
	state.bullets = [];
	state.explosions = [];
	state.effects = [];
	state.wind = {
			angle : -90,
			strength : 0,
			bufferedCaption : createText("0", 50, "white", 2, "black"),
		};
	state.terrainBitsName = null;
	state.snapshotDelta = 200;
	state.usedItem = false;
	state.currentTurn = -1;
	state.hasMoved = true;
	state.countdown = null;
	state.turnStartTime = 0;
	state.requestToStartCurrentTurn = false;
	state.timePenalty = 0;
	state.startDelay = 200;
	state.listenerRegistered = false;
	state.chatFocused = false;
	state.messageQueue = [];
	state.lastMessageTime = 0;
	state.isGamePlaying = false;
	state.backgroundColor = "white";
	state.terrainAssetName = "crepes";
	state.terrainBitsName = "green_terrain_bits";
	state.initialized = false;
}

function renderRoomInfo() {
	if (!client.currentRoom) return;
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
	if(client.currentRoom.owner != client.userid) {
		document.getElementById('room_start_game_button').style.display = 'none';
	} else {
		document.getElementById('room_start_game_button').style.display = 'block';
	}
	if(client.currentRoom.gameType == 'team') {
		document.getElementById('room_swap_team_button').style.display = 'block';
	} else {
		document.getElementById('room_swap_team_button').style.display = 'none';
	}
}

function displayLobby() {
	client.currentRoom = null;
	document.getElementById('lobby_layer').style.display = 'block';
	document.getElementById('room_layer').style.display = 'none';
}


socket.on('new_room_owner', function(msg) {
	if(!client.currentRoom) return;
	client.currentRoom.owner = msg['userid'];
	renderRoomInfo();
});


socket.on('start_game_failure', function() {
	document.getElementById('room_start_game_button').innerHTML = 'Start Game';
	document.getElementById('room_start_game_button').style.cursor = 'pointer';
	client.currentRoom.starting = false;
	addSystemMessage('Game start failure. Room is not fully occupied yet.');
	renderRoomChatMessage();
});

function renderRoomChatMessage() {
	var disp = "";
	for (var i = Math.max(0, state.messageQueue.length - CONST.MAX_MESSAGE_DISPLAY); i < state.messageQueue.length; ++i){
		disp += "<div style='color:black'><b><i><span style='color:brown'>"+state.messageQueue[i].name + "</span></i></b>: <span style='font-weight:lighter'>" + state.messageQueue[i].msg + "</span><br/></div>";
	}
	var display = document.getElementById("waiting_room_chat_display");
	display.innerHTML = disp;
	display.scrollTop = display.scrollHeight;
}



function Player(x, y, color, name) {
	this.ANGLE_LOWER_LIMIT = CONST.ANGLE_LOWER_LIMIT;
	this.ANGLE_UPPER_LIMIT = CONST.ANGLE_UPPER_LIMIT;
	this.PLAYER_WIDTH = CONST.PLAYER_WIDTH;
	this.PLAYER_HEIGHT = CONST.PLAYER_HEIGHT;
	this.BARREL_WIDTH = CONST.BARREL_WIDTH;
	this.BARREL_HEIGHT = CONST.BARREL_HEIGHT;
	this.BARREL_COLOR = CONST.BARREL_COLOR;
	this.MAX_BULLET_THRUST = CONST.MAX_BULLET_THRUST;
	this.MAX_HEALTH_POINT = 1700;
	this.PLAYER_VERTICAL_MOVEMENT_LIMIT = CONST.PLAYER_VERTICAL_MOVEMENT_LIMIT;

	this.name = name;
	this.x = x
	this.y = y
	this.v = 0;
	this.color = color;
	this.thrust = 0;
	this.dir = [1, 0];
	this.hp = this.MAX_HEALTH_POINT;
	this.angle = 45;
	this.orientation = 1;
	this.command = {};
	this.power = 0;
	this.isAlive = true;
	this.renderable = true;
	this.shoutoutDelta = 0;

	this.itemSlot = ["dual", "power", "health"];

	this.damagedDelta = 0;

	this.bufferCaption();
}

Player.prototype.bufferCaption = function() {
	this.bufferedCaption = createText(this.name, 21, "white");
}

Player.prototype.render = function(g) {
	if(!this.renderable) return;
	var theta = Math.atan2(this.dir[1], this.dir[0]);

	g.save();
	g.translate(this.x, this.y);

	g.save();
	g.rotate(theta);
	if (this == state.player[CONST.MAIN_PLAYER]) this.renderAngleProtractor(g);
	this.renderBody(g);
	this.renderBarrel(g);
	g.restore();

	this.renderNameCaption(g);
	if (this.isAlive) this.renderHealthBar(g);
	this.renderShoutout(g);
	g.restore();
}

Player.prototype.renderAngleProtractor = function(g) {
	g.save();
	g.scale(this.orientation, 1);
	g.translate(44, -44);
	g.globalAlpha = 0.75;
	gameAsset.renderAsset("angle_protractor", g);
	g.restore();
}

Player.prototype.renderBody = function(g) {
	if (!this.isAlive) {
		this.PLAYER_HEIGHT = 30;
		this.color = "#633";
		this.BARREL_COLOR = "#633";
	}
	g.fillStyle = this.color;
	if (this.damagedDelta > 0) {
		this.damagedDelta--;
		g.fillStyle = "red";
		g.strokeStyle = "red";
	}
	g.lineWidth = 3;
	g.fillRect(-this.PLAYER_WIDTH/2, -this.PLAYER_HEIGHT/2, this.PLAYER_WIDTH, this.PLAYER_HEIGHT);
	g.strokeRect(-this.PLAYER_WIDTH/2, -this.PLAYER_HEIGHT/2, this.PLAYER_WIDTH, this.PLAYER_HEIGHT);
}

Player.prototype.renderBarrel = function(g) {
	g.save();
	g.scale(this.orientation, 1);
	g.rotate(-this.angle * Math.PI/180);
	g.fillStyle = this.BARREL_COLOR;
	g.lineWidth = 2;
	g.fillRect(0, -this.BARREL_HEIGHT/2, this.BARREL_WIDTH, this.BARREL_HEIGHT);
	g.strokeRect(0, -this.BARREL_HEIGHT/2, this.BARREL_WIDTH, this.BARREL_HEIGHT);
	g.restore();
}

Player.prototype.renderNameCaption = function(g) {
	var w = this.bufferedCaption.width;
	var h = this.bufferedCaption.height;
	g.fillStyle = "rgba(0,0,0, 0.6)";
	g.fillRect(-(w+10)/2, 20, w+10, h);
	g.drawImage(this.bufferedCaption, 0, 0, w, h, -w/2, 20, w, h);
}

Player.prototype.renderHealthBar = function(g) {
	var w = CONST.HEALTH_BAR_LENGTH;
	var h = 6;
	var offset = -48;
	g.fillStyle = "red";
	g.fillRect(-w/2, offset, w, h);
	g.fillStyle = "green";
	g.fillRect(-w/2, offset, w * this.hp / this.MAX_HEALTH_POINT, h);
}

Player.prototype.renderShoutout = function(g){
	if (this.shoutoutDelta <= 0) return;
	this.shoutoutDelta--;
	g.save();
	g.strokeStyle = "black";
	g.lineWidth = 1;
	g.fillStyle = "rgba(255,255,255,0.85)";
	g.translate(40, -this.bufferedShoutout.height - 50)
	g.fillRect(-4, 0, this.bufferedShoutout.width+8, this.bufferedShoutout.height);
	g.drawImage(this.bufferedShoutout, 0, 0, this.bufferedShoutout.width, this.bufferedShoutout.height, 4, 0, this.bufferedShoutout.width, this.bufferedShoutout.height);
	g.strokeRect(-4, 0, this.bufferedShoutout.width+8, this.bufferedShoutout.height);
	g.restore();
}

Player.prototype.commandHandler = function() {
	if (this.command["ADJUST_ANGLE_UP"]) {
		this.angle += CONST.ANGLE_DELTA;
		if (this.angle > this.ANGLE_UPPER_LIMIT) {
			this.angle = this.ANGLE_UPPER_LIMIT;
		}
		this.command["ADJUST_ANGLE_UP"] = false;
	}
	if (this.command["ADJUST_ANGLE_DOWN"]) {
		this.angle -= CONST.ANGLE_DELTA;
		if (this.angle < this.ANGLE_LOWER_LIMIT) {
			this.angle = this.ANGLE_LOWER_LIMIT;
		}
		this.command["ADJUST_ANGLE_DOWN"] = false;
	}
	if (this.command["CHARGE_POWER"]) {
		this.command["CHARGING_POWER"] = true;
		this.command["CHARGE_POWER"] = false;
		this.power = 0;
	}
	if (this.command["CHARGING_POWER"]) {
		this.power += CONST.POWER_DELTA;
		if (this.power > CONST.MAX_POWER) this.power = CONST.MAX_POWER;
		if (this == state.player[CONST.MAIN_PLAYER]) {
			state.powerBar.power = this.power;
		}
	}
	if (this.command["ANOTHER_SHOOT"]) {
		this.shootingDelay--;
		if (this.shootingDelay <= 0) {
			state.bullets.push(this.createBullet());
			this.command["ANOTHER_SHOOT"] = false;
		}
	}
	if (this.command["SHOOT"]) {
		state.bullets.push(this.createBullet());
		if (this.shootingPowerUp == "dual") {
			this.command["ANOTHER_SHOOT"] = true;
			this.shootingDelay = 50;
		}
		this.shootingPowerUp = "none";
		this.command["SHOOT"] = false;
		state.viewMode["LOCKED_BULLET_VIEW_MODE"] = true;
		state.viewMode["LOCKED_PLAYER_VIEW_MODE"] = false;
	}
	if (this.command["USE_ITEM"] && this.command["USE_ITEM"].use) {
		var i = this.command["USE_ITEM"].which;
		if (this.itemSlot[i] != "empty"){
			state.effects.push(createUseItemEffect(this));
			if (this.itemSlot[i] == "health") {
				this.hp += CONST.ITEM_HEALTH_UP_EFFECT;
				if (this.hp > this.MAX_HEALTH_POINT) this.hp = this.MAX_HEALTH_POINT;
			} else if (this.itemSlot[i] == "dual") {
				this.shootingPowerUp = "dual";
			} else if (this.itemSlot[i] == "power") {
				this.shootingPowerUp = "power";
			}
			this.itemSlot[i] = "empty";
		}
	}
}

Player.prototype.createBullet = function() {
	var d = [this.orientation * this.dir[0], this.orientation * this.dir[1]];
	d[0] = Math.floor(d[0] * 100)/100;
	d[1] = Math.floor(d[1] * 100)/100;
	rotate(d, this.orientation * Math.floor(this.angle) * Math.PI/180);
	var theta = Math.floor(Math.atan2(d[1], d[0])/Math.PI*180);
	d[0] = Math.cos(theta/180*Math.PI);
	d[1] = Math.sin(theta/180*Math.PI);
	var x = this.x + d[0] * (this.BARREL_WIDTH + 20);
	var y = this.y + d[1] * (this.BARREL_WIDTH + 20);
	var r = this.power / CONST.MAX_POWER * this.MAX_BULLET_THRUST;
	var v = [r * d[0], r * d[1]];
	return this.bulletFactory(x, y, v);
}

Player.prototype.bulletFactory = function(x, y, v) {
	if (this.shootingPowerUp == "power") {
		return new PowerBullet(x, y, v);
	}
	return new Bullet(x, y, v);
}

Player.prototype.movementUpdate = function() {
	if (!this.renderable) return;

	var temp = {
		x : this.x,
		y : this.y,
		dir : [this.dir[0], this.dir[1]],
		v : this.v,
	};
	temp.v += CONST.GRAVITY;
	temp.y += temp.v;
	var pivots = computePivots(temp);
	if (checkCollision(pivots[0]) || checkCollision(pivots[1])) {
		temp = resolveTerrainCollision(this, temp);
	}

	setPlayerState(this, temp);

	pivots = computePivots(temp);
	if (checkCollision(pivots[0])||checkCollision(pivots[1])) return;
	temp.x += this.thrust;
	pivots = computePivots(temp);
	if (checkCollision(pivots[0]) || checkCollision(pivots[1])) {
		temp = resolveTerrainCollision(this, temp);
	}

	if (this.y - temp.y < this.PLAYER_VERTICAL_MOVEMENT_LIMIT) setPlayerState(this, temp);

	if (this.y > CONST.WORLD_WIDTH) {
		this.isAlive = false;
		this.renderable = false;
	}
}

Player.prototype.receiveDamage = function(damage) {
	if (!this.isAlive) {
		return;
	}
	this.hp -= damage;
	this.damagedDelta = 20;
	if (this.hp <= 0) {
		this.hp = 0;
		this.isAlive = false;
	}
	createDamageEffect(this.x, this.y-20, damage);
}

Player.prototype.setShoutout = function(msg) {
	this.shoutoutDelta = 300;
	this.lastMessage = msg;
	state.g.font = "21px Arial";
	var w = state.g.measureText(msg).width;
	var cw = w/msg.length;
	var MAX_WIDTH = 250;
	var EXPECTED_LINEHEIGHT = 21 * 1.2;
	var charperline = Math.floor(MAX_WIDTH/cw);
	var y = 0;
	this.bufferedShoutout = document.createElement("canvas");
	this.bufferedShoutout.width = Math.min(w, MAX_WIDTH) + 8;
	this.bufferedShoutout.height = Math.ceil(w/MAX_WIDTH)* EXPECTED_LINEHEIGHT;
	var g = this.bufferedShoutout.getContext("2d");
	g.font = "21px Arial";
	g.fillStyle = "black";
	g.textBaseline = "top";
	for(var i = 0; i < msg.length; i += charperline) {
		var t = msg.substring(i, Math.min(msg.length,i+charperline));
		if (i+charperline < msg.length) {
			var c = msg[i+charperline];
			if (c != ' ' && c != '.') t += '-';
		}
		g.fillText(t, 0, y);
		y += EXPECTED_LINEHEIGHT;
	}
}

function Bullet(x, y, v) {
	this.x = x;
	this.y = y;
	this.v = v;
	this.isAlive = true;
	this.EXPLOSION_RADIUS = CONST.EXPLOSION_RADIUS;
	this.GRAVITY = CONST.GRAVITY;
	this.WIND_STRENGTH_CALLIBRATOR = CONST.WIND_STRENGTH_CALLIBRATOR;
	this.BULLET_RADIUS = CONST.BULLET_RADIUS;
	this.EXPLOSION_DAMAGE = 500;
	this.aliveTime = 0;
}

Bullet.prototype.update = function(state) {
	if (this.x < 0 || this.x > CONST.WORLD_WIDTH || this.y > CONST.WORLD_HEIGHT || this.y < CONST.LOWEST_Y_LIMIT) {
		this.isAlive = false;
	}
	this.x += this.v[0];
	this.y += this.v[1];

	if (checkBulletCollision(this)) {
		state.explosions.push(createExplosion(this.x, this.y+16, this.EXPLOSION_RADIUS, this.EXPLOSION_DAMAGE));
		this.isAlive = false;
	}

	var wind = computeWindForce();
	this.v[0] += wind[0] * this.WIND_STRENGTH_CALLIBRATOR;
	this.v[1] += wind[1] * this.WIND_STRENGTH_CALLIBRATOR + this.GRAVITY;
	this.aliveTime++;
}

Bullet.prototype.render = function(g) {
	var theta = Math.atan2(this.v[1], this.v[0]);
	g.save();
	g.translate(this.x, this.y);
	g.rotate(theta);
	this.renderBody(g);
	g.restore();
}

Bullet.prototype.renderBody = function(g) {
	g.fillStyle = "#f01";
	g.lineWidth = 3;
	g.fillRect(-this.BULLET_RADIUS - 10,-this.BULLET_RADIUS, this.BULLET_RADIUS+20, this.BULLET_RADIUS*2);
	g.fillStyle = "white"
	g.fillRect(-this.BULLET_RADIUS ,-this.BULLET_RADIUS, 10, this.BULLET_RADIUS*2);
	g.strokeRect(-this.BULLET_RADIUS - 10,-this.BULLET_RADIUS, this.BULLET_RADIUS+20, this.BULLET_RADIUS*2);
}


function PowerBullet(x, y, v) {
	Bullet.call(this, x, y, v);
	this.BULLET_RADIUS += 4;
	this.EXPLOSION_DAMAGE += 800;
}

PowerBullet.prototype = Object.create(Bullet.prototype);

addEventListener("DOMContentLoaded", function() {
	registerListenerForLoginScreen();
	registerListenerForLobbyScreen();
	registerListenerForRoomScreen();
	initialize();
	gameAsset["lobby"].play();
	//startGame();
});

var state = {
	player : [],
	viewMode : {},
	viewOffset : [0, 0],
	terrainOffset : [250, 0],
	powerBar : {
		power : 0,
		marker : 0,
	},
	bullets : [],
	explosions : [],
	effects : [],
	wind : {
		angle : -90,
		strength : 0,
		bufferedCaption : createText("0", 50, "white", 2, "black"),
	},
	terrainBitsName : null,
	snapshotDelta : 200,
	usedItem : false,
	currentTurn : -1,
	hasMoved : true,
	countdown : null,
	turnStartTime : 0,
	requestToStartCurrentTurn : false,
	timePenalty : 0,
	startDelay : 200,
	listenerRegistered : false,
	chatFocused : false,
	messageQueue : [],
	lastMessageTime : 0,
	isGamePlaying : false,
	backgroundColor: "white",
	terrainAssetName: "crepes",
	terrainBitsName : "green_terrain_bits",
	initialized : false,
};

var CONST = {
	MAIN_PLAYER : 0,
	TIME_DELTA : 1000/60,
	PLAYER_WIDTH : 64,
	PLAYER_HEIGHT : 64,
	PLAYER_SPEED : 1,
	PLAYER_MASS : 3,
	ANGLE_DELTA : 1,
	ANGLE_LOWER_LIMIT : 20,
	ANGLE_UPPER_LIMIT : 55,
	GRAVITY : 0.28,
	OPAQUE_VALUE : 80,
	WORLD_WIDTH : 2500,
	WORLD_HEIGHT : 1000,
	BARREL_WIDTH : 50,
	BARREL_HEIGHT: 16,
	BARREL_COLOR : "#fff",
	CONTROL_BAR_COLOR : "rgba(0,0,0,0.6)",
	CONTROL_BAR_HEIGHT : 100,
	CONTROL_BAR_WIDTH : 1000,
	MAX_POWER : 200,
	POWER_BAR_HEIGHT : 40,
	POWER_BAR_COLOR : "#000",
	POWER_BAR_RATIO : 0.8,
	POWER_DELTA : 1,
	POWER_BAR_ACTIVE_COLOR : "#f00",
	ANGLE_BAR_WIDTH : 80,
	BULLET_RADIUS : 10,
	MAX_BULLET_THRUST : 40,
	MAX_WIND_STRENGTH : 10,
	EXPLOSION_RADIUS : 60,
	WIND_STRENGTH_CALLIBRATOR : 0.015,
	HEALTH_BAR_LENGTH : 80,
	VIEW_SHIFT_RATIO : 1.5,
	CAMERA_VIEW_UPPERLIMIT : 1300,
	PLAYER_VERTICAL_MOVEMENT_LIMIT : 8,
	MAX_ITEM_BAR_SLOTS : 3,
	ITEM_SLOT_WIDTH : 200,
	ITEM_HEALTH_UP_EFFECT : 500,
	SNAPSHOT_TIMEFRAME : 100,
	X_ERROR_TOLERANCE : 2,
	SLOWDOWN_CONSTANT : 0.5,
	MESSAGE_FLOOD_LIMIT : 200,
	MAX_MESSAGE_DISPLAY : 10,
	START_DELAY: 80,
	END_OF_TURN_DELAY: 100,
	HIGH_ANGLE: 200,
	ULTRA_HIGH_ANGLE: 400,
	LOWEST_Y_LIMIT: -2600,
	SNAPSHOT_EXTRA_DELAY: 300,
};

function initialize() {
	state.display = document.getElementById("display");
	state.display.width = window.innerWidth;
	state.display.height = window.innerHeight;
	state.g = display.getContext("2d");
}


function initializeAsset() {
	state.terrainBuffer = terrainAssets.get(state.terrainAssetName);
	state.terrainData = state.terrainBuffer.getContext("2d").getImageData(0, 0, state.terrainBuffer.width, state.terrainBuffer.height);
}

function spawnPlayers() {
	var startHeight = 0;
	state.player.push(new Player(state.display.width/2, startHeight, "#fab", "prajogo"));
	state.player.push(new Player(state.display.width/2 + 300, startHeight, "#8af", "chang_Hong"));
	state.player.push(new Player(state.display.width/2 + 800, startHeight, "#8e7", "chinjieh"));
	state.player.push(new Player(state.display.width/2 - 400, startHeight, "#99a", "nigel"));
}

function initializeGameState() {
	initializeAsset();
}

function startGame() {
	state.isGamePlaying = true;
	client.currentRoom.status = 'playing';
	initializeGameState();
	state.viewMode["LOCKED_PLAYER_VIEW_MODE"] = true;
	//spawnPlayers();
	if (!client.listenerRegistered) {
		registerEventListener();
		client.listenerRegistered = true;
	}

	if (state.timer) {
		clearInterval(state.timer);
	}
	state.timer = setInterval(function(){
		update();
		render();
		relay();
		if (!state.player[CONST.MAIN_PLAYER].isAlive) {
			announceDeath();
			state.hasMoved = true;
		}
		if (state.requestToStartCurrentTurn) {
			if (state.bullets.length == 0 && state.explosions.length == 0) {
				if (state.startDelay > 0) {
					state.startDelay--;
					return;
				}
				state.requestToStartCurrentTurn = false;
				setPlayerTurnActive();
			}
		} else if (state.currentTurn == client.userid && state.hasMoved && state.isGamePlaying) {
			if (state.bullets.length == 0 && !state.player[CONST.MAIN_PLAYER].command["ANOTHER_SHOOT"]) {
				if (state.endOfTurnDelay > 0) {
					state.endOfTurnDelay--;
					return;
				}
				endOfTurn();
			}
		}
		if (state.requestWindChange && state.bullets.length == 0 && state.explosions.length == 0) {
			state.requestWindChange = false;
			setWind(state.requestedWindAngle, state.requestedWindPower);
			addSystemMessage('[NOTICE] WIND HAS CHANGED.');
		}
	}, CONST.TIME_DELTA);

}

function relay() {
	state.snapshotDelta--;
	if (state.snapshotDelta <= 0) {
		state.snapshotBlocked = false;
		var p = state.player[CONST.MAIN_PLAYER];
		socket.emit('current_snapshot', {
			'userid' : client.userid,
			'username' : client.username,
			'x' : p.x,
			'y' : p.y,
			'orientation' : p.orientation,
			'angle' : p.angle,
			'v' : p.v,
			'dir' : p.dir,
			'hp' : p.hp,
		});
		state.snapshotDelta = CONST.SNAPSHOT_TIMEFRAME;
	} 
}

function computeMouseOffset(e) {
	return [e.pageX - state.display.offsetLeft, e.pageY - state.display.offsetTop];
}

function registerEventListener() {
	addEventListener("mousedown", function(e) {
		if (onControlBar(e)) {
			handleControlBarMouseClick(e);
			return;
		}
		state.viewMode["SHIFT_VIEW_MODE"] = true;
		state.shiftOrigin = computeMouseOffset(e);
		state.mouseOffset = computeMouseOffset(e);
		state.prevViewOffset = [state.viewOffset[0], state.viewOffset[1]];
	});
	addEventListener("mouseup", function(e) {
		state.viewMode["SHIFT_VIEW_MODE"] = false;
	})
	addEventListener("mousemove", function(e) {
		state.mouseOffset = computeMouseOffset(e);
	});
	addEventListener("keydown", function(e) {
		if ((e.which == 8 || e.which == 13) && !state.chatFocused && state.isGamePlaying) {
			document.getElementById('chat_input').focus();
		}
		var isPlayerTurn = (state.currentTurn == client.userid);
		if (state.hasMoved) isPlayerTurn = false;
		if(e.which == 37) {
			if(isPlayerTurn) state.player[CONST.MAIN_PLAYER].thrust = -CONST.PLAYER_SPEED;
			state.player[CONST.MAIN_PLAYER].orientation = -1;
			state.viewMode["LOCKED_PLAYER_VIEW_MODE"] = true;
		} else if (e.which == 39) {
			if(isPlayerTurn) state.player[CONST.MAIN_PLAYER].thrust = CONST.PLAYER_SPEED;
			state.player[CONST.MAIN_PLAYER].orientation = 1;
			state.viewMode["LOCKED_PLAYER_VIEW_MODE"] = true;
		} else if (e.which == 38) {
			state.player[CONST.MAIN_PLAYER].command["ADJUST_ANGLE_UP"] = true;
		} else if (e.which == 40) {
			state.player[CONST.MAIN_PLAYER].command["ADJUST_ANGLE_DOWN"] = true;
		} else if (e.which == 32 && isPlayerTurn && !state.chatFocused) {
			if(!state.player[CONST.MAIN_PLAYER].command["CHARGING_POWER"]) {
				state.player[CONST.MAIN_PLAYER].command["CHARGE_POWER"] = true;
			}
		}
	});
	addEventListener("keyup", function(e) {
		if (!state.isGamePlaying) return;
		state.player[CONST.MAIN_PLAYER].thrust = 0;
		state.player[CONST.MAIN_PLAYER].command = {
			"CHARGING_POWER" : state.player[CONST.MAIN_PLAYER].command["CHARGING_POWER"],
			"CHARGE_POWER" : state.player[CONST.MAIN_PLAYER].command["CHARGE_POWER"]
		};
		if (e.which == 32 && !state.hasMoved && !state.chatFocused) {
			state.hasMoved = true;
			state.player[CONST.MAIN_PLAYER].command["SHOOT"] = true;
			state.player[CONST.MAIN_PLAYER].command["CHARGING_POWER"] = false;
			state.player[CONST.MAIN_PLAYER].command["CHARGE_POWER"] = false;
			socket.emit("player_shoot", {
				'userid' : client.userid,
				'x' : state.player[CONST.MAIN_PLAYER].x,
				'y' : state.player[CONST.MAIN_PLAYER].y,
				'v' : state.player[CONST.MAIN_PLAYER].v,
				'orientation' : state.player[CONST.MAIN_PLAYER].orientation,
				'angle' : state.player[CONST.MAIN_PLAYER].angle,
				'dir' : state.player[CONST.MAIN_PLAYER].dir,
				'power' : state.player[CONST.MAIN_PLAYER].power,
			});
			state.snapshotDelta = CONST.SNAPSHOT_EXTRA_DELAY;
			state.snapshotBlocked = true;
		}
	});

	document.getElementById("chat_input").addEventListener('focus', function(e) {
		if (!state.chatFocused){
			state.chatFocused = true;
			document.getElementById("chat_ui_notif").style.setProperty("display", "block")
		}
	});

	document.getElementById("chat_input").addEventListener('blur', function(e) {
		state.chatFocused = false;
		document.getElementById("chat_ui_notif").style.setProperty("display", "none");
	});

	document.getElementById("chat_input").addEventListener("keydown", function(e) {
		if (e.which == 13) {
			document.getElementById("chat_input").blur();
			sendMessage(document.getElementById("chat_input").value);
			document.getElementById("chat_input").value = "";
			e.stopPropagation();
			return false;
		}
		if (document.getElementById("chat_input").value.length >= 100 && e.which != 8) {
			e.preventDefault();
			return false;
		} 
	});



}

function onControlBar(e) {
	var offset = computeMouseOffset(e);
	var x = (state.display.width - CONST.CONTROL_BAR_WIDTH)/2;
	var y = state.display.height - CONST.CONTROL_BAR_HEIGHT;
	return (x < offset[0] && offset[0] < x + CONST.CONTROL_BAR_WIDTH && 
		y < offset[1] && offset[1] < y + CONST.CONTROL_BAR_HEIGHT);
}

function handleControlBarMouseClick(e) {
	var offset = computeMouseOffset(e);
	var x = (state.display.width - CONST.CONTROL_BAR_WIDTH)/2;
	var y = state.display.height - CONST.CONTROL_BAR_HEIGHT;
	offset[0] -= x;
	offset[1] -= y;
	if (offset[1] > CONST.CONTROL_BAR_HEIGHT - CONST.POWER_BAR_HEIGHT) {
		setPowerMarker(offset[0]/CONST.CONTROL_BAR_WIDTH);
		return;
	}

	if (state.currentTurn != client.userid || state.hasMoved) return;

	//check item bar
	if (!state.player[CONST.MAIN_PLAYER].command["USE_ITEM"] || (state.player[CONST.MAIN_PLAYER].command["USE_ITEM"].use == false && !state.usedItem) ) {
		for (var i = 0; i < CONST.MAX_ITEM_BAR_SLOTS; ++i) {
			if (i*CONST.ITEM_SLOT_WIDTH < offset[0] - CONST.ANGLE_BAR_WIDTH && offset[0] - CONST.ANGLE_BAR_WIDTH < (i+1)*CONST.ITEM_SLOT_WIDTH) {
				state.usedItem = true;
				state.player[CONST.MAIN_PLAYER].command["USE_ITEM"] = {use : true, which : i};
				socket.emit('player_use_item', {'which':i});
			}
		}
	}
}

function update() {
	cameraEventsHandler();

	updateExplosions();
	updatePlayers();
	updateBullets();
}

function updateExplosions() {
	for (var i = 0; i < state.explosions.length; ++i) {
		updateExplosion(state.explosions[i]);
	}
	state.explosions = [];
}

function updatePlayers() {
	for(var i = 0; i < state.player.length;++i) {
		if (i != CONST.MAIN_PLAYER && client.currentRoom.member[i] && client.currentRoom.member[i].currentSnapshot && !client.currentRoom.member[i].currentSnapshot.obsolete) {
			if (Math.abs(state.player[i].x - client.currentRoom.member[i].currentSnapshot.x) < CONST.X_ERROR_TOLERANCE) {
				state.player[i].x = client.currentRoom.member[i].currentSnapshot.x;
				state.player[i].y = client.currentRoom.member[i].currentSnapshot.y;
				state.player[i].orientation = client.currentRoom.member[i].currentSnapshot.orientation;
				state.player[i].v = client.currentRoom.member[i].currentSnapshot.v;
				state.player[i].dir = client.currentRoom.member[i].currentSnapshot.dir;
				state.player[i].hp = client.currentRoom.member[i].currentSnapshot.hp;
				state.player[i].thrust = 0;
				client.currentRoom.member[i].currentSnapshot.obsolete = true;
			} else {
				state.player[i].orientation = state.player[i].x < client.currentRoom.member[i].currentSnapshot.x ? 1 : -1;
				state.player[i].thrust = client.currentRoom.member[i].suggestedThrust;
				if (state.player[i].angle != client.currentRoom.member[i].currentSnapshot.angle) {
					state.player[i].command[(state.player[i].angle - client.currentRoom.member[i].currentSnapshot.angle > 0 ? "ADJUST_ANGLE_DOWN":"ADJUST_ANGLE_UP")] = true;
				}
			}
		}
		state.player[i].commandHandler();
		state.player[i].movementUpdate();
	}

}

function updateBullets() {
	var tmp = [];
	for (var i = 0; i < state.bullets.length; ++i) {
		state.bullets[i].update(state);
		if (state.bullets[i].isAlive) tmp.push(state.bullets[i]);
	}
	state.bullets = tmp;
}

function cameraEventsHandler() {
	if (state.viewMode["SHIFT_VIEW_MODE"]) {
		state.viewMode["LOCKED_PLAYER_VIEW_MODE"] = false;
		var dx = state.mouseOffset[0] - state.shiftOrigin[0];
		var dy = state.mouseOffset[1] - state.shiftOrigin[1];
		state.viewOffset = [state.prevViewOffset[0] + dx * CONST.VIEW_SHIFT_RATIO, state.prevViewOffset[1] + dy * CONST.VIEW_SHIFT_RATIO];
	}
	else if (state.viewMode["LOCKED_BULLET_VIEW_MODE"]) {
		if (state.bullets.length == 0) {
			state.viewMode["LOCKED_BULLET_VIEW_MODE"] = false;
		} else {
			var d = [-state.bullets[0].x + state.display.width/2, -state.bullets[0].y + state.display.height/2];
			state.viewOffset[0] -= (state.viewOffset[0] - d[0])*0.41;
			state.viewOffset[1] -= (state.viewOffset[1] - d[1])*0.41;
		}
	}
	else if (state.viewMode["LOCKED_PLAYER_VIEW_MODE"]) {
		state.viewOffset[0] = -state.player[CONST.MAIN_PLAYER].x + state.display.width/2;
		state.viewOffset[1] = -state.player[CONST.MAIN_PLAYER].y + state.display.height/2;
	}
	if (state.viewOffset[1] > CONST.CAMERA_VIEW_UPPERLIMIT) state.viewOffset[1] = CONST.CAMERA_VIEW_UPPERLIMIT;
	if (state.viewOffset[1] < -CONST.WORLD_HEIGHT/2) state.viewOffset[1] = -CONST.WORLD_HEIGHT/2;
	if (state.viewOffset[0] > 0) state.viewOffset[0] = 0;
	if (state.viewOffset[0] < -CONST.WORLD_WIDTH/2)  state.viewOffset[0] = -CONST.WORLD_WIDTH/2;
}

function updateExplosion(explosion) {
	if(!explosion.isExploded) {
		checkPlayerExplosionCollision(explosion);
		explosion.isExploded = true;
	}
	destroyTerrainEffect(explosion);
}

function checkPlayerExplosionCollision(explosion) {
	for (var i = 0; i < state.player.length; ++i) {
		var player = state.player[i];
		var dx = explosion.x - player.x;
		var dy = explosion.y - player.y;
		var dist = Math.sqrt(dx*dx + dy*dy);
		if (dist < explosion.radius + player.PLAYER_WIDTH/2) {
			player.receiveDamage(explosion.damage *  (1 - dist/(explosion.radius+player.PLAYER_WIDTH/2)));
		}
	}
}

function destroyTerrainEffect(explosion) {
	var g = state.terrainBuffer.getContext("2d");
	g.save();
	g.globalCompositeOperation = 'destination-out';
	g.beginPath();
	g.arc(explosion.x - state.terrainOffset[0], explosion.y - state.terrainOffset[1], explosion.radius, 0, 2*Math.PI);
	g.fill();
	g.globalCompositeOperation = 'source-atop';
	g.lineWidth = 10;
	g.stroke();
	g.restore();
	state.terrainData = g.getImageData(0, 0, state.terrainBuffer.width, state.terrainBuffer.height);
}

function createExplosion(x, y, radius, damage) {
	return {
		"x" : x,
		"y" : y,
		"radius" : radius,
		"damage" : damage,
		isExploded : false,
	};
}

function computeWindForce() {
	var alpha = state.wind.angle * Math.PI / 180;
	var r = state.wind.strength;
	return [r * Math.cos(alpha), r * Math.sin(alpha)];
}

function checkBulletCollision(bullet) {
	var collided = false;
	var bulletRect = bullet.BULLET_RADIUS * 0.80;
	for (var i = 0; i < state.player.length; ++i) {
		var playerRect = state.player[i].PLAYER_HEIGHT/2 * 0.80;
		if (Math.abs(bullet.x - state.player[i].x) < bulletRect + playerRect &&
			Math.abs(bullet.y - state.player[i].y) < bulletRect + playerRect) {
			collided = true;
			break;
		}
	}
	if (collided) {
		if (bullet.aliveTime > CONST.ULTRA_HIGH_ANGLE) {
			addSystemMessage("ULTRA HIGH ANGLE!!!!!!");
		} else if (bullet.aliveTime > CONST.HIGH_ANGLE) {
			addSystemMessage("HIGH ANGLE!!!");
		} 
	}
	//terrain
	if(checkCollision([bullet.x, bullet.y]) || 
	checkCollision([bullet.x - bulletRect, bullet.y - bulletRect]) ||
	checkCollision([bullet.x + bulletRect, bullet.y + bulletRect]) || 
	checkCollision([bullet.x + bulletRect, bullet.y - bulletRect]) ||
	checkCollision([bullet.x - bulletRect, bullet.y + bulletRect]) ) {
		collided = true;
		createDestroyedTerrainEffect(bullet, state.terrainBitsName);
	}

	return collided;
}

function setPlayerState(player, temp) {
	player.x = temp.x;
	player.y = temp.y;
	player.dir = temp.dir;
	player.v = temp.v;
}

function checkCollision(coor) {
	var x = coor[0]-state.terrainOffset[0];
	var y = coor[1]-state.terrainOffset[1];
	if (x < 0 || y < 0) return false;
	if (y >= state.terrainBuffer.height || x >= state.terrainBuffer.width) return false;
	// var img = state.terrainBuffer.getContext("2d").getImageData(x, y-1, 1, 1);
	// for (var i = 0; i < img.data.length; i += 4) {
	// 	if (img.data[i+3] > CONST.OPAQUE_VALUE) return true;
	// }

	return (state.terrainData.data[Math.floor(y)*state.terrainBuffer.width*4 + Math.floor(x)*4 + 3] > CONST.OPAQUE_VALUE);
}

function computePivots(player) {
	// [front, back]
	var x = player.x;
	var y = player.y;
	var d = player.dir;
	var n = [-d[1], d[0]];
	var h = CONST.PLAYER_HEIGHT*0.5;
	var w = CONST.PLAYER_WIDTH*0.5;
	return [
		[x+w*d[0]+h*n[0], y+w*d[1]+h*n[1]],
		[x-w*d[0]+h*n[0], y-w*d[1]+h*n[1]],
	];
}

function resolveTerrainCollision(player, end) {
	var tmp = {
		x : end.x,
		y : player.y,
		dir : [player.dir[0], player.dir[1]],
		v : CONST.PLAYER_MASS,
	}
	var frontCheck = false, backCheck = false;
	var delta = 1;
	if (checkCollision(computePivots(tmp)[0]) || checkCollision(computePivots(tmp)[1])) {
		for (var i = player.y; ; i -= delta) {
			tmp.y = i;
			var pivots = computePivots(tmp);
			var fcheck = checkCollision(pivots[0]);
			var bcheck = checkCollision(pivots[1]);
			if (!fcheck && !bcheck) {
				break;
			}
			frontCheck = fcheck;
			backCheck = bcheck;
		}
	} else {
		for (var i = player.y; i < end.y; i += delta) {
			tmp.y = i;
			var pivots = computePivots(tmp);
			frontCheck = checkCollision(pivots[0]);
			backCheck = checkCollision(pivots[1]);
			if (frontCheck || backCheck) {
				tmp.y -= delta;
				break;
			}
		}
	}

	if(frontCheck && backCheck) return tmp;

	var pivot, free;
	var pivots = [computePivots(tmp), computePivots(end)];
	if (frontCheck) {
		pivot = pivots[0][0];
		free = pivots[1][1];
	} else {
		pivot = pivots[0][1];
		free = pivots[1][0];
	}
	var d = [free[0]-pivot[0], free[1]-pivot[1]];
	normalize(d);

	free = [pivot[0]+d[0]*CONST.PLAYER_WIDTH, pivot[1]+d[1]*CONST.PLAYER_WIDTH];
	while (checkCollision(free)) {
		rotate(d, 0.4*Math.PI/180 * (frontCheck ? -1 : 1));
		free[0] = pivot[0]+d[0]*CONST.PLAYER_WIDTH;
		free[1] = pivot[1]+d[1]*CONST.PLAYER_WIDTH;
	}

	var n = [-d[1], d[0]];
	if (d[0] < 0) {
		n[0] = -n[0];
		n[1] = -n[1];
	}
	tmp.x = pivot[0]+d[0]*CONST.PLAYER_WIDTH*0.5-n[0]*CONST.PLAYER_HEIGHT*0.5;
	tmp.y = pivot[1]+d[1]*CONST.PLAYER_WIDTH*0.5-n[1]*CONST.PLAYER_HEIGHT*0.5;
	if(d[0] < 0) {
		d[0] = -d[0];
		d[1] = -d[1];
	}
	tmp.dir = d;
	return tmp;
}

function normalize(d) {
	var len = Math.sqrt(d[0]*d[0]+d[1]*d[1]);
	d[0] /= len;
	d[1] /= len;
}

function rotate(d, theta) {
	// positive theta => anti-clockwise direction convention.
	var x = d[0], y = d[1];
	d[0] = x*Math.cos(theta) + y*Math.sin(theta);
	d[1] = -x*Math.sin(theta) + y*Math.cos(theta);
}





function render() {
	state.g.fillStyle = state.backgroundColor;
	state.g.fillRect(0, 0, state.display.width, state.display.height);

	state.g.save();
	state.g.translate(state.viewOffset[0], state.viewOffset[1]);
	renderTerrain();
	renderPlayers();
	renderBullets();
	renderEffects();
	state.g.restore();

	renderControlBar();
}

function renderPlayers() {
	for(var i = 0; i < state.player.length; ++i) {
		state.player[i].render(state.g);
	}
	if (state.currentTurn != -1) renderPointer(client.currentRoom.hashed_member[state.currentTurn].player);
}

function renderPointer(player) {
	state.g.save();
	state.g.globalAlpha = 0.5;
	state.g.translate(player.x, player.y-90);
	gameAsset.renderAsset("pointer_arrow", state.g);
	state.g.restore();
}

function renderBullets() {
	for(var i = 0; i < state.bullets.length; ++i) {
		state.bullets[i].render(state.g);
	}
}

function renderEffects() {
	var tmp = [];
	for (var i = 0; i < state.effects.length; ++i) {
		state.effects[i].render(state.g);
		if (state.effects[i].isAlive) tmp.push(state.effects[i]);
	}
	state.effects = tmp;
}

function renderTerrain() {
	state.g.drawImage(state.terrainBuffer, 0, 0, state.terrainBuffer.width, state.terrainBuffer.height,
						state.terrainOffset[0], state.terrainOffset[1], state.terrainBuffer.width, state.terrainBuffer.height
	);
}

function renderControlBar() {
	var g = state.g;
	g.save();
	g.fillStyle = CONST.CONTROL_BAR_COLOR;
	g.lineWidth = 3;
	g.fillRect((state.display.width - CONST.CONTROL_BAR_WIDTH - 4)/2, state.display.height - CONST.CONTROL_BAR_HEIGHT - 30, CONST.CONTROL_BAR_WIDTH + 4, CONST.CONTROL_BAR_HEIGHT + 30);
	renderPowerBar();
	renderWindCompass();
	renderAngleBar();
	renderItemBar();
	g.restore();
}

function renderWindCompass() {
	var g = state.g;
	g.save();
		g.translate(state.display.width/2, 80);
		g.save();
			g.rotate((state.wind.angle + 90) * Math.PI/180);
			gameAsset.renderAsset("wind_compass", g);
		g.restore();
		g.drawImage(state.wind.bufferedCaption, 0, 0, state.wind.bufferedCaption.width, state.wind.bufferedCaption.height, -state.wind.bufferedCaption.width/2, -state.wind.bufferedCaption.height/2, state.wind.bufferedCaption.width, state.wind.bufferedCaption.height);
	g.restore();
}

function renderItemBar() {
	var g = state.g;
	g.save();
	g.translate((state.display.width - CONST.CONTROL_BAR_WIDTH)/2 + CONST.ANGLE_BAR_WIDTH, 
				state.display.height - CONST.CONTROL_BAR_HEIGHT);
	var h = CONST.CONTROL_BAR_HEIGHT - CONST.POWER_BAR_HEIGHT;
	g.fillStyle = "rgba(30,30,30,0.7)";
	g.strokeStyle = "rgba(120, 120, 45, 0.4)";
	g.lineWidth = 2;


	for (var i = 0; i < CONST.MAX_ITEM_BAR_SLOTS; ++i) {
		g.fillRect(i * CONST.ITEM_SLOT_WIDTH , 0, CONST.ITEM_SLOT_WIDTH, h);
	}

	for (var i = 0; i < CONST.MAX_ITEM_BAR_SLOTS; ++i) {
		if (state.player[CONST.MAIN_PLAYER].itemSlot[i] != "empty") {
			g.save();
			g.translate(i * CONST.ITEM_SLOT_WIDTH + CONST.ITEM_SLOT_WIDTH/2, h/2);
			gameAsset.renderAsset(state.player[CONST.MAIN_PLAYER].itemSlot[i], g);
			g.restore();
		} 
	}
	
	for(var i = 0; i < CONST.MAX_ITEM_BAR_SLOTS; ++i) {
		g.strokeRect(i * CONST.ITEM_SLOT_WIDTH, 0, CONST.ITEM_SLOT_WIDTH, h);
	}

	g.restore();
}

function setWind(angle, strength) {
	state.wind.angle = angle;
	state.wind.strength = strength;
	state.wind.bufferedCaption = createText(""+strength, 40, "white", 2, "black");
}

function createText(text, size, color, lineWidth, strokeColor, font) {
	var buffer = document.createElement("canvas");
	var g = buffer.getContext("2d");
	g.font = size+"px " + (font || "Arial");
	buffer.width = g.measureText(text).width;
	buffer.height = size * 1.1;

	g.font = size+"px " + (font || "Arial");
	g.fillStyle = color;
	g.fillText(text, 0, buffer.height/1.3);
	if (strokeColor) {
		g.strokeStyle = strokeColor;
		g.lineWidth = lineWidth;
		g.strokeText(text, 0, buffer.height/1.3);
	}
	return buffer;
}

function setPowerMarker(x) {
	state.powerBar.marker = x;
}

function renderPowerBar() {
	var g = state.g;
	g.save();
	g.fillStyle = CONST.POWER_BAR_COLOR;
	var x = (state.display.width - CONST.CONTROL_BAR_WIDTH)/2;
	var y = state.display.height - CONST.POWER_BAR_HEIGHT;
	g.fillRect(x, y, CONST.CONTROL_BAR_WIDTH, CONST.POWER_BAR_HEIGHT);
	var activePowerWidth = (CONST.CONTROL_BAR_WIDTH - 8) * state.powerBar.power / CONST.MAX_POWER;
	g.fillStyle = CONST.POWER_BAR_ACTIVE_COLOR;
	g.fillRect(x + 4, y + 4, activePowerWidth, CONST.POWER_BAR_HEIGHT - 8);

	g.strokeStyle = "white";
	g.lineWidth = 2;
	for (var i = 0; i < 4; ++i) {
		g.strokeRect(x+1+i*CONST.CONTROL_BAR_WIDTH/4, y+1, (CONST.CONTROL_BAR_WIDTH-5)/4, CONST.POWER_BAR_HEIGHT-2);
	}
	g.fillStyle = "yellow"
	g.fillRect(x + state.powerBar.marker * CONST.CONTROL_BAR_WIDTH, y+1, 7, CONST.POWER_BAR_HEIGHT-2);
	g.restore();
}

function renderAngleBar() {
	var g = state.g;
	var x = (state.display.width - CONST.CONTROL_BAR_WIDTH)/2;
	var y = state.display.height - CONST.CONTROL_BAR_HEIGHT;
	var h = CONST.CONTROL_BAR_HEIGHT - CONST.POWER_BAR_HEIGHT;

	var p = state.player[CONST.MAIN_PLAYER];
	var d = [p.dir[0] * p.orientation, p.dir[1] * p.orientation];
	d[0] = Math.floor(d[0] * 100)/100;
	d[1] = Math.floor(d[1] * 100)/100;
	rotate(d, Math.floor(p.angle) * p.orientation / 180 * Math.PI);
	var theta = Math.floor(Math.atan2(d[1], d[0])/Math.PI*180);
	theta = -theta;
	if (theta > 90) theta = 180 - theta;
	if (theta < -90) theta = -180 - theta;
	g.fillStyle = "rgba(244, 244, 0, 0.6)";
	g.fillRect(x, y, CONST.ANGLE_BAR_WIDTH, h);
	g.fillStyle = "white";
	if (theta < 0) {
		theta = -theta;
		g.fillStyle = "rgba(244, 10, 0, 0.6)";
	}
	g.strokeStyle = "black";
	g.font = "bold 45px Arial";
	g.lineWidth = 2;
	var offsetY = 45;
	g.fillText(theta, x + 12, y + offsetY);
	g.strokeText(theta, x + 12, y + offsetY);
	g.save();
	g.translate(x+67, y+16);
	gameAsset.renderAsset("degree_circle", g);
	g.restore();
}

function createDamageEffect(x, y, dmg) {
	var damageEffect = {};
	damageEffect.x = x;
	damageEffect.y = y;
	damageEffect.delta = 40;
	damageEffect.isAlive = true;
	damageEffect.caption = createText(""+Math.floor(dmg), 30, "red", 1, "black");
	damageEffect.render = function(g){
		if (!damageEffect.isAlive) return;
		var w = damageEffect.caption.width;
		var h = damageEffect.caption.height;
		damageEffect.y -= 1;
		g.drawImage(damageEffect.caption, 0, 0, w, h, damageEffect.x - w/2, damageEffect.y - h/2, w, h);
		damageEffect.delta--;
		if (damageEffect.delta <= 0) damageEffect.isAlive = false;
	}
	state.effects.push(damageEffect);
}

function createDestroyedTerrainEffect(bullet, assetName) {
	function generator(x, y, spin, dir, assetName) {
		var effect = {};
		effect.x = x;
		effect.y = y;
		effect.isAlive = true;
		effect.dir = dir;
		effect.spin = spin;
		effect.render = function(g) {
			effect.dir[1] += CONST.GRAVITY;
			effect.y += effect.dir[1];
			effect.x += effect.dir[0];
			effect.spin += (effect.spin > 0 ? 1 : -1) * Math.PI/180;
			g.save();
			g.translate(effect.x, effect.y);
			g.rotate(effect.spin);
			gameAsset.renderAsset(assetName, g);
			g.restore();
			if (effect.y > CONST.WORLD_HEIGHT) effect.isAlive = false;
		}
		return effect;
	}
	var force = 15;
	for (var i = 0; i < 3; ++ i) {
		state.effects.push(generator(bullet.x+Math.random()*force-force/2, bullet.y+Math.random()*force-force/2, Math.random()-0.5, [bullet.v[0] + Math.random()*force - force/2, bullet.v[1] + Math.random()*force - force/2], assetName));
	}
}

function createUseItemEffect(player) {
	var effect = {};
	effect.x = player.x;
	effect.y = player.y;
	effect.r = 7;
	effect.delta = 50;
	effect.isAlive = true;
	effect.render = function(g) {
		if (effect.r < 70) effect.r *= 1.09;
		effect.delta--;
		g.beginPath();
		g.fillStyle = "rgba(200, 244, 120, 0.5)";
		g.arc(effect.x, effect.y, effect.r, 0, 2*Math.PI);
		g.fill();
		if (effect.delta <= 0) effect.isAlive = false;
	}
	return effect;
}

var terrainAssets = {
	get : function(name) {
		terrainBuffer = document.createElement("canvas");
		this[name](terrainBuffer);
		return terrainBuffer;
	},
	"test_asset01" : function(terrainBuffer) {
		var width = 1000;
		var height = 600;
		terrainBuffer.width = width;
		terrainBuffer.height = height;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, width, height);
		g.fillStyle = "green";
		g.lineWidth = 5;
		g.save();
		g.translate(0, 100);
		g.beginPath();
		g.moveTo(238,410);
		g.lineTo(174,404);
		g.lineTo(112,370);
		g.lineTo(91,336);
		g.lineTo(86,285);
		g.lineTo(129,241);
		g.lineTo(168,227);
		g.lineTo(211,211);
		g.lineTo(237,200);
		g.lineTo(255,184);
		g.lineTo(270,153);
		g.lineTo(285,114);
		g.lineTo(295,79);
		g.lineTo(311,61);
		g.lineTo(338,50);
		g.lineTo(358,48);
		g.lineTo(377,57);
		g.lineTo(394,79);
		g.lineTo(411,104);
		g.lineTo(436,147);
		g.lineTo(456,180);
		g.lineTo(475,203);
		g.lineTo(514,226);
		g.lineTo(560,240);
		g.lineTo(594,242);
		g.lineTo(634,238);
		g.lineTo(653,229);
		g.lineTo(690,208);
		g.lineTo(715,187);
		g.lineTo(729,172);
		g.lineTo(764,148);
		g.lineTo(774,142);
		g.lineTo(790,138);
		g.lineTo(835,137);
		g.lineTo(892,145);
		g.lineTo(917,160);
		g.lineTo(949,185);
		g.lineTo(970,221);
		g.lineTo(985,253);
		g.lineTo(989,276);
		g.lineTo(978,316);
		g.lineTo(949,344);
		g.lineTo(917,369);
		g.lineTo(877,395);
		g.lineTo(811,416);
		g.lineTo(749,427);
		g.lineTo(665,435);
		g.lineTo(610,435);
		g.lineTo(530,428);
		g.lineTo(464,424);
		g.lineTo(401,414);
		g.lineTo(353,410);
		g.lineTo(297,404);
		g.closePath();
		g.fill();
		g.stroke();
		g.restore();
	},
	"test_asset02" : function(terrainBuffer) {
		var width = 1800;
		var height = 600;
		terrainBuffer.width = width;
		terrainBuffer.height = height;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, width, height);
		g.fillStyle = "green";
		g.lineWidth = 5;
		g.save();
		g.beginPath();
		g.moveTo(504,516);
		g.lineTo(444,519);
		g.lineTo(344,523);
		g.lineTo(271,515);
		g.lineTo(205,506);
		g.lineTo(150,482);
		g.lineTo(125,455);
		g.lineTo(104,424);
		g.lineTo(90,392);
		g.lineTo(79,337);
		g.lineTo(79,276);
		g.lineTo(79,237);
		g.lineTo(96,198);
		g.lineTo(134,175);
		g.lineTo(195,153);
		g.lineTo(232,150);
		g.lineTo(287,167);
		g.lineTo(328,201);
		g.lineTo(368,208);
		g.lineTo(409,221);
		g.lineTo(449,225);
		g.lineTo(511,237);
		g.lineTo(572,240);
		g.lineTo(607,242);
		g.lineTo(658,242);
		g.lineTo(696,229);
		g.lineTo(718,198);
		g.lineTo(752,185);
		g.lineTo(801,179);
		g.lineTo(834,190);
		g.lineTo(871,204);
		g.lineTo(901,227);
		g.lineTo(945,235);
		g.lineTo(981,233);
		g.lineTo(1033,233);
		g.lineTo(1074,208);
		g.lineTo(1075,176);
		g.lineTo(1080,139);
		g.lineTo(1120,121);
		g.lineTo(1179,121);
		g.lineTo(1236,138);
		g.lineTo(1263,167);
		g.lineTo(1290,191);
		g.lineTo(1320,224);
		g.lineTo(1343,270);
		g.lineTo(1326,326);
		g.lineTo(1295,358);
		g.lineTo(1263,364);
		g.lineTo(1201,384);
		g.lineTo(1145,388);
		g.lineTo(1073,408);
		g.lineTo(997,426);
		g.lineTo(939,442);
		g.lineTo(882,456);
		g.lineTo(854,402);
		g.lineTo(843,370);
		g.lineTo(816,340);
		g.lineTo(785,306);
		g.lineTo(745,275);
		g.lineTo(704,290);
		g.lineTo(689,330);
		g.lineTo(675,385);
		g.lineTo(661,425);
		g.lineTo(633,452);
		g.lineTo(591,480);
		g.lineTo(556,494);
		g.closePath();
		g.fill();
		g.stroke();
		g.restore();
	},
	"test_asset03" : function(terrainBuffer) {
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "green";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(200,475);
		g.lineTo(131,418);
		g.lineTo(100,353);
		g.lineTo(93,277);
		g.lineTo(122,192);
		g.lineTo(221,161);
		g.lineTo(308,170);
		g.lineTo(386,201);
		g.lineTo(443,221);
		g.lineTo(519,248);
		g.lineTo(583,260);
		g.lineTo(657,265);
		g.lineTo(724,267);
		g.lineTo(785,267);
		g.lineTo(845,264);
		g.lineTo(891,246);
		g.lineTo(944,211);
		g.lineTo(999,183);
		g.lineTo(1043,169);
		g.lineTo(1094,169);
		g.lineTo(1218,209);
		g.lineTo(1256,220);
		g.lineTo(1294,232);
		g.lineTo(1341,248);
		g.lineTo(1390,249);
		g.lineTo(1448,242);
		g.lineTo(1516,203);
		g.lineTo(1583,148);
		g.lineTo(1615,131);
		g.lineTo(1643,121);
		g.lineTo(1682,115);
		g.lineTo(1720,117);
		g.lineTo(1755,125);
		g.lineTo(1792,135);
		g.lineTo(1828,161);
		g.lineTo(1864,195);
		g.lineTo(1890,243);
		g.lineTo(1909,302);
		g.lineTo(1893,364);
		g.lineTo(1845,434);
		g.lineTo(1633,508);
		g.lineTo(1477,512);
		g.lineTo(1278,471);
		g.lineTo(1123,409);
		g.lineTo(1030,381);
		g.lineTo(864,391);
		g.lineTo(744,416);
		g.lineTo(662,436);
		g.lineTo(584,447);
		g.lineTo(505,437);
		g.lineTo(452,413);
		g.lineTo(351,397);
		g.lineTo(292,409);
		g.lineTo(246,458);
		g.closePath();
		g.fill();
		g.stroke();
	},
	"test_asset04" : function(terrainBuffer) {
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "green";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(259,484);
		g.lineTo(187,459);
		g.lineTo(158,425);
		g.lineTo(130,378);
		g.lineTo(125,328);
		g.lineTo(149,281);
		g.lineTo(193,275);
		g.lineTo(237,285);
		g.lineTo(291,300);
		g.lineTo(347,298);
		g.lineTo(388,273);
		g.lineTo(419,241);
		g.lineTo(464,212);
		g.lineTo(509,216);
		g.lineTo(529,251);
		g.lineTo(524,292);
		g.lineTo(503,338);
		g.lineTo(458,389);
		g.lineTo(413,440);
		g.lineTo(356,471);
		g.lineTo(311,477);
		g.closePath();
		g.fill();
		g.moveTo(742,530);
		g.lineTo(687,485);
		g.lineTo(665,447);
		g.lineTo(655,410);
		g.lineTo(657,366);
		g.lineTo(676,314);
		g.lineTo(729,279);
		g.lineTo(787,286);
		g.lineTo(831,328);
		g.lineTo(861,369);
		g.lineTo(912,405);
		g.lineTo(981,415);
		g.lineTo(1068,409);
		g.lineTo(1113,437);
		g.lineTo(1121,498);
		g.lineTo(1077,529);
		g.lineTo(1014,562);
		g.lineTo(928,568);
		g.lineTo(860,565);
		g.lineTo(815,555);
		g.closePath();
		g.fill();
		g.moveTo(1293,391);
		g.lineTo(1335,373);
		g.lineTo(1385,339);
		g.lineTo(1427,302);
		g.lineTo(1460,272);
		g.lineTo(1526,261);
		g.lineTo(1591,272);
		g.lineTo(1636,290);
		g.lineTo(1689,304);
		g.lineTo(1722,302);
		g.lineTo(1765,293);
		g.lineTo(1816,297);
		g.lineTo(1843,341);
		g.lineTo(1844,393);
		g.lineTo(1796,437);
		g.lineTo(1740,475);
		g.lineTo(1684,499);
		g.lineTo(1610,500);
		g.lineTo(1531,501);
		g.lineTo(1464,494);
		g.lineTo(1390,497);
		g.lineTo(1351,518);
		g.lineTo(1293,523);
		g.lineTo(1267,493);
		g.lineTo(1247,455);
		g.lineTo(1237,420);
		g.lineTo(1255,389);
		g.closePath();
		g.fill();
		g.stroke();
	},
	"lindbulm" : function(terrainBuffer) {
		state.backgroundColor = "#FBF9FF";
		state.terrainBitsName = "green_terrain_bits";
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "green";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(95,454);
		g.lineTo(28,410);
		g.lineTo(4,288);
		g.lineTo(18,218);
		g.lineTo(31,174);
		g.lineTo(56,157);
		g.lineTo(85,130);
		g.lineTo(145,117);
		g.lineTo(215,85);
		g.lineTo(259,40);
		g.lineTo(295,18);
		g.lineTo(362,6);
		g.lineTo(434,1);
		g.lineTo(485,11);
		g.lineTo(540,35);
		g.lineTo(576,59);
		g.lineTo(622,69);
		g.lineTo(685,70);
		g.lineTo(756,51);
		g.lineTo(820,32);
		g.lineTo(868,11);
		g.lineTo(947,9);
		g.lineTo(1018,32);
		g.lineTo(1192,48);
		g.lineTo(1240,38);
		g.lineTo(1286,28);
		g.lineTo(1329,12);
		g.lineTo(1401,7);
		g.lineTo(1538,33);
		g.lineTo(1594,54);
		g.lineTo(1655,64);
		g.lineTo(1720,48);
		g.lineTo(1769,20);
		g.lineTo(1845,15);
		g.lineTo(1909,19);
		g.lineTo(1953,59);
		g.lineTo(1985,91);
		g.lineTo(1981,148);
		g.lineTo(1982,216);
		g.lineTo(1928,287);
		g.lineTo(1901,338);
		g.lineTo(1883,426);
		g.lineTo(1874,517);
		g.lineTo(1856,581);
		g.lineTo(1698,587);
		g.lineTo(1596,582);
		g.lineTo(1549,548);
		g.lineTo(1469,526);
		g.lineTo(1367,532);
		g.lineTo(1273,544);
		g.lineTo(1030,552);
		g.lineTo(965,539);
		g.lineTo(896,493);
		g.lineTo(775,473);
		g.lineTo(579,416);
		g.lineTo(425,426);
		g.lineTo(347,450);
		g.lineTo(275,487);
		g.lineTo(171,479);
		g.closePath();
		g.fill();
		g.stroke();
	},
	"hearow": function(terrainBuffer) {
		// background: FFA230
		state.backgroundColor = "#FFA230";
		state.terrainBitsName = "hot_terrain_bits";
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "#EB3725";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(370,358);
		g.lineTo(260,354);
		g.lineTo(185,395);
		g.lineTo(140,474);
		g.lineTo(38,449);
		g.lineTo(21,388);
		g.lineTo(20,328);
		g.lineTo(43,248);
		g.lineTo(81,206);
		g.lineTo(157,162);
		g.lineTo(233,156);
		g.lineTo(327,156);
		g.lineTo(388,163);
		g.lineTo(428,115);
		g.lineTo(452,64);
		g.lineTo(511,12);
		g.lineTo(576,18);
		g.lineTo(617,53);
		g.lineTo(657,90);
		g.lineTo(703,153);
		g.lineTo(704,242);
		g.lineTo(660,294);
		g.lineTo(548,336);
		g.lineTo(454,353);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(588,439);
		g.lineTo(659,442);
		g.lineTo(735,432);
		g.lineTo(798,390);
		g.lineTo(834,337);
		g.lineTo(882,303);
		g.lineTo(977,253);
		g.lineTo(1058,244);
		g.lineTo(1156,253);
		g.lineTo(1229,280);
		g.lineTo(1275,326);
		g.lineTo(1329,361);
		g.lineTo(1381,376);
		g.lineTo(1439,380);
		g.lineTo(1477,457);
		g.lineTo(1477,518);
		g.lineTo(1368,556);
		g.lineTo(1271,576);
		g.lineTo(1151,583);
		g.lineTo(1045,551);
		g.lineTo(971,570);
		g.lineTo(915,577);
		g.lineTo(817,562);
		g.lineTo(715,563);
		g.lineTo(621,575);
		g.lineTo(571,526);
		g.lineTo(550,473);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1458,208);
		g.lineTo(1343,195);
		g.lineTo(1297,151);
		g.lineTo(1274,98);
		g.lineTo(1313,52);
		g.lineTo(1369,31);
		g.lineTo(1466,15);
		g.lineTo(1578,17);
		g.lineTo(1655,40);
		g.lineTo(1702,78);
		g.lineTo(1781,100);
		g.lineTo(1853,101);
		g.lineTo(1907,111);
		g.lineTo(1949,133);
		g.lineTo(1992,189);
		g.lineTo(1991,256);
		g.lineTo(1974,331);
		g.lineTo(1923,369);
		g.lineTo(1815,386);
		g.lineTo(1748,314);
		g.lineTo(1655,290);
		g.lineTo(1583,268);
		g.lineTo(1525,246);
		g.closePath();
		g.fill();
		g.stroke();
	},
	"herbestus" : function(terrainBuffer) {
		state.backgroundColor = "#F5FFFF";
		state.terrainBitsName = "snowy_terrain_bits";
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "#E8FFEE";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(85,502);
		g.lineTo(58,478);
		g.lineTo(33,437);
		g.lineTo(25,402);
		g.lineTo(13,345);
		g.lineTo(2,297);
		g.lineTo(3,226);
		g.lineTo(0,136);
		g.lineTo(0,54);
		g.lineTo(17,20);
		g.lineTo(63,4);
		g.lineTo(136,2);
		g.lineTo(175,22);
		g.lineTo(216,48);
		g.lineTo(268,84);
		g.lineTo(307,122);
		g.lineTo(366,158);
		g.lineTo(412,181);
		g.lineTo(470,202);
		g.lineTo(535,214);
		g.lineTo(592,221);
		g.lineTo(648,237);
		g.lineTo(720,252);
		g.lineTo(785,261);
		g.lineTo(851,274);
		g.lineTo(937,290);
		g.lineTo(1003,296);
		g.lineTo(1068,299);
		g.lineTo(1131,296);
		g.lineTo(1185,288);
		g.lineTo(1252,275);
		g.lineTo(1306,264);
		g.lineTo(1365,257);
		g.lineTo(1420,237);
		g.lineTo(1474,228);
		g.lineTo(1559,199);
		g.lineTo(1633,182);
		g.lineTo(1690,160);
		g.lineTo(1754,136);
		g.lineTo(1795,111);
		g.lineTo(1835,64);
		g.lineTo(1868,36);
		g.lineTo(1910,25);
		g.lineTo(1948,33);
		g.lineTo(1972,59);
		g.lineTo(1986,92);
		g.lineTo(1995,133);
		g.lineTo(1980,205);
		g.lineTo(1956,271);
		g.lineTo(1892,331);
		g.lineTo(1832,389);
		g.lineTo(1765,424);
		g.lineTo(1672,459);
		g.lineTo(1579,481);
		g.lineTo(1491,497);
		g.lineTo(1413,504);
		g.lineTo(1347,516);
		g.lineTo(1246,521);
		g.lineTo(1151,530);
		g.lineTo(1038,534);
		g.lineTo(967,537);
		g.lineTo(901,521);
		g.lineTo(815,520);
		g.lineTo(717,519);
		g.lineTo(618,519);
		g.lineTo(519,523);
		g.lineTo(467,502);
		g.lineTo(415,436);
		g.lineTo(366,380);
		g.lineTo(305,344);
		g.lineTo(260,353);
		g.lineTo(233,367);
		g.lineTo(194,418);
		g.lineTo(170,454);
		g.lineTo(125,481);
		g.closePath();
		g.fill();
		g.stroke();
	},
	'crepes':function(terrainBuffer) {
		state.backgroundColor = "#FBF9FF";
		state.terrainBitsName = "green_terrain_bits";
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "green";
		g.lineWidth = "5";
		g.beginPath();

		g.moveTo(41,70);
		g.lineTo(121,65);
		g.lineTo(204,50);
		g.lineTo(284,59);
		g.lineTo(351,68);
		g.lineTo(410,68);
		g.lineTo(473,68);
		g.lineTo(488,98);
		g.lineTo(462,133);
		g.lineTo(392,139);
		g.lineTo(314,140);
		g.lineTo(248,146);
		g.lineTo(179,154);
		g.lineTo(77,139);
		g.lineTo(36,126);
		g.lineTo(13,99);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(361,236);
		g.lineTo(404,218);
		g.lineTo(455,206);
		g.lineTo(530,204);
		g.lineTo(598,204);
		g.lineTo(647,201);
		g.lineTo(709,201);
		g.lineTo(764,212);
		g.lineTo(816,223);
		g.lineTo(821,275);
		g.lineTo(765,300);
		g.lineTo(688,306);
		g.lineTo(630,302);
		g.lineTo(556,302);
		g.lineTo(469,315);
		g.lineTo(404,279);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(781,133);
		g.lineTo(855,116);
		g.lineTo(899,106);
		g.lineTo(966,99);
		g.lineTo(1018,97);
		g.lineTo(1076,108);
		g.lineTo(1128,110);
		g.lineTo(1184,116);
		g.lineTo(1197,143);
		g.lineTo(1167,167);
		g.lineTo(1099,186);
		g.lineTo(1044,186);
		g.lineTo(965,177);
		g.lineTo(895,178);
		g.lineTo(822,178);
		g.lineTo(778,184);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(723,196);
		g.lineTo(756,170);
		g.lineTo(790,162);
		g.lineTo(822,165);
		g.lineTo(811,215);
		g.lineTo(756,238);
		g.lineTo(699,232);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1137,240);
		g.lineTo(1183,210);
		g.lineTo(1245,180);
		g.lineTo(1304,180);
		g.lineTo(1381,181);
		g.lineTo(1437,181);
		g.lineTo(1512,185);
		g.lineTo(1565,206);
		g.lineTo(1591,250);
		g.lineTo(1560,259);
		g.lineTo(1496,264);
		g.lineTo(1458,243);
		g.lineTo(1390,249);
		g.lineTo(1323,256);
		g.lineTo(1251,241);
		g.lineTo(1200,251);
		g.lineTo(1159,274);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1546,135);
		g.lineTo(1570,117);
		g.lineTo(1631,94);
		g.lineTo(1713,82);
		g.lineTo(1796,81);
		g.lineTo(1851,81);
		g.lineTo(1896,89);
		g.lineTo(1942,99);
		g.lineTo(1963,124);
		g.lineTo(1959,164);
		g.lineTo(1920,170);
		g.lineTo(1873,157);
		g.lineTo(1815,157);
		g.lineTo(1787,154);
		g.lineTo(1741,159);
		g.lineTo(1679,165);
		g.lineTo(1618,167);
		g.lineTo(1559,165);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1493,376);
		g.lineTo(1541,365);
		g.lineTo(1587,352);
		g.lineTo(1652,350);
		g.lineTo(1698,356);
		g.lineTo(1766,361);
		g.lineTo(1820,375);
		g.lineTo(1816,416);
		g.lineTo(1774,434);
		g.lineTo(1721,423);
		g.lineTo(1635,423);
		g.lineTo(1584,430);
		g.lineTo(1519,429);
		g.lineTo(1456,418);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(843,415);
		g.lineTo(886,395);
		g.lineTo(927,385);
		g.lineTo(980,377);
		g.lineTo(1052,371);
		g.lineTo(1103,378);
		g.lineTo(1146,397);
		g.lineTo(1165,429);
		g.lineTo(1150,450);
		g.lineTo(1097,462);
		g.lineTo(1044,460);
		g.lineTo(984,455);
		g.lineTo(900,454);
		g.lineTo(838,444);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(38,463);
		g.lineTo(72,438);
		g.lineTo(114,431);
		g.lineTo(185,428);
		g.lineTo(255,428);
		g.lineTo(317,430);
		g.lineTo(365,447);
		g.lineTo(385,474);
		g.lineTo(364,495);
		g.lineTo(286,506);
		g.lineTo(221,506);
		g.lineTo(148,506);
		g.lineTo(106,501);
		g.lineTo(52,504);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1028,164);
		g.lineTo(898,198);
		g.lineTo(800,204);
		g.lineTo(726,175);
		g.lineTo(750,106);
		g.lineTo(892,68);
		g.lineTo(1052,58);
		g.lineTo(1153,61);
		g.lineTo(1205,85);
		g.lineTo(1229,131);
		g.lineTo(1151,169);
		g.lineTo(1102,156);
		g.closePath();
		g.fill();
		g.stroke();
	}
}

var gameAsset = (function() {
	var asset = {};

	asset.buffer = document.createElement("canvas");
	asset.buffer.width = 1000;
	asset.buffer.height = 1000;

	var g = asset.buffer.getContext("2d");
	g.clearRect(0, 0, asset.buffer.width, asset.buffer.height);

	// main getter function
	asset.renderAsset = function(name, g) {
		g.drawImage(asset.buffer, asset[name].offsetX, asset[name].offsetY, asset[name].width, asset[name].height,
					-asset[name].width/2, -asset[name].height/2, asset[name].width, asset[name].height);
	}

	// wind compass
	asset["wind_compass"] = {
		offsetX : 0,
		offsetY : 0,
		width : 100,
		height : 100,
	}

	// draw wind compass
	g.save();
	g.translate(asset["wind_compass"].offsetX, asset["wind_compass"].offsetY);
	g.fillStyle = "rgba(0,0,0,0.5)";
	g.lineWidth = 5;
	g.beginPath();
	g.arc(asset["wind_compass"].width/2, asset["wind_compass"].width/2, asset["wind_compass"].width/2-5, 0, 2*Math.PI);
	g.fill();
	g.stroke();
	g.beginPath();
	g.fillStyle = "rgba(22, 170, 131, 0.8)";
	g.moveTo(asset["wind_compass"].width/2, asset["wind_compass"].width/2 + 20);
	g.lineTo(asset["wind_compass"].width/2 - 20, asset["wind_compass"].width/2 + 30);
	g.lineTo(asset["wind_compass"].width/2, asset["wind_compass"].width/2 - 30);
	g.lineTo(asset["wind_compass"].width/2 + 20, asset["wind_compass"].width/2 + 30);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();



	// green terrain bits
	asset["green_terrain_bits"] = {
		offsetX : 100,
		offsetY : 0,
		width : 40,
		height : 40,
	}
	g.save();
	g.fillStyle = "green";
	g.lineWidth = 3;
	g.translate(100, 0);
	g.beginPath();
	g.moveTo(13,9);
	g.lineTo(7,17);
	g.lineTo(5,26);
	g.lineTo(12,32);
	g.lineTo(20,32);
	g.lineTo(26,36);
	g.lineTo(33,31);
	g.lineTo(32,19);
	g.lineTo(33,9);
	g.lineTo(24,8);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();


	// degree circle
	asset["degree_circle"] = {
		offsetX : 0,
		offsetY : 100,
		width : 30,
		height : 30,
	}
	g.save();
	g.translate(0, 100);
	g.font = "bold 20px Arial";
	g.fillStyle = "white";
	g.strokeStyle = "black";
	g.lineWidth = 1;
	g.fillText("o", 10, 15);
	g.strokeText("o", 10, 15);
	g.restore();

	// angle protractor
	asset["angle_protractor"] = {
		offsetX : 30,
		offsetY : 100,
		width : 100,
		height : 100,
	}
	g.save();
	g.translate(30, 100);

	g.fillStyle = "rgba(240, 240, 0, 0.3)";
	g.beginPath();
	g.moveTo(0,100);
	//g.lineTo(80,100);
	g.arc(0, 100, 80, 0, Math.PI/2, true);
	//g.lineTo(0,80);
	g.closePath();
	g.fill();

	

	g.beginPath();
	g.fillStyle = "rgba(0,0,0,0.5)";
	g.strokeStyle = "rgba(0,0,0,0.5)";
	g.lineWidth = 2;
	g.arc(0, 100, 80, 0, Math.PI/2, true);
	g.stroke();
	g.fillRect(0, 20, 2, 30);
	g.fillRect(50, 98, 30, 2);

	g.restore();


	// DUAL
	asset["dual"] = {
		offsetX : 160,
		offsetY : 100,
		width : 200,
		height : 60,
	}
	g.save();
	g.translate(160, 100);

	g.beginPath();
	g.moveTo(30, 0);
	g.lineTo(170, 0);
	g.lineTo(200, 20);
	g.lineTo(200, 40);
	g.lineTo(170, 60);
	g.lineTo(30, 60);
	g.lineTo(0, 40);
	g.lineTo(0, 20);
	g.closePath();
	g.globalAlpha = 0.6;
	g.fillStyle = "#FC7C69";
	g.fill();
	g.lineWidth = 6;
	g.strokeStyle = "#FF2814";
	g.stroke();
	g.globalAlpha = 1;

	g.save();
	g.restore();

	g.fillStyle = "white";
	g.strokeStyle = "black";
	g.font = "bold 35px Arial";
	g.fillText("Dual", 55, 30);
	g.lineWidth = 2;
	g.strokeText("Dual", 55, 30);
	g.font = "bold 55px Arial";
	g.lineWidth = 3;
	g.fillText("Dual", 40, 50);
	g.strokeText("Dual", 40, 50);
	g.restore();



	// power
	asset["power"] = {
		offsetX : 370,
		offsetY : 100,
		width : 200,
		height : 60,
	}
	g.save();
	g.translate(370, 100);

	g.beginPath();
	g.moveTo(30, 0);
	g.lineTo(170, 0);
	g.lineTo(200, 20);
	g.lineTo(200, 40);
	g.lineTo(170, 60);
	g.lineTo(30, 60);
	g.lineTo(0, 40);
	g.lineTo(0, 20);
	g.closePath();
	g.fillStyle = "#001BFF";
	g.globalAlpha = 0.5;
	g.fill();
	g.lineWidth = 6;
	g.strokeStyle = "#001BFF";
	g.stroke();
	g.globalAlpha = 1;

	g.save();
	g.restore();

	g.fillStyle = "white";
	g.strokeStyle = "black";
	g.font = "bold 43px Arial";
	g.lineWidth = 3;
	g.fillText("Power", 33, 45);
	g.strokeText("Power", 33, 45);
	g.restore();


	// health
	asset["health"] = {
		offsetX : 570,
		offsetY : 100,
		width : 200,
		height : 60,
	}
	g.save();
	g.translate(570, 100);

	g.beginPath();
	g.moveTo(30, 0);
	g.lineTo(170, 0);
	g.lineTo(200, 20);
	g.lineTo(200, 40);
	g.lineTo(170, 60);
	g.lineTo(30, 60);
	g.lineTo(0, 40);
	g.lineTo(0, 20);
	g.closePath();
	g.globalAlpha = 0.6;
	g.fillStyle = "red";
	g.fill();
	g.lineWidth = 6;
	g.strokeStyle = "red";
	g.stroke();
	g.globalAlpha = 1;


	g.save();
	g.restore();

	g.fillStyle = "white";
	g.strokeStyle = "black";
	g.font = "bold 43px Arial";
	g.lineWidth = 3;
	g.fillText("Health", 33, 45);
	g.strokeText("Health", 33, 45);
	g.restore();


	// pointer arrow
	asset["pointer_arrow"] = {
		offsetX : 0,
		offsetY : 170,
		width : 60,
		height : 60,
	}
	g.save();
	g.translate(0, 170);
	g.clearRect(0,0,60, 60);
	g.beginPath();
	g.lineWidth = 3;
	g.fillStyle = "red";
	g.moveTo(12, 8);
	g.lineTo(48, 8);
	g.lineTo(30, 45);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();


	// hot terrain bits
	asset["hot_terrain_bits"] = {
		offsetX : 0,
		offsetY : 240,
		width : 40,
		height : 40,
	}
	g.save();
	g.fillStyle = "#EB3725";
	g.lineWidth = 3;
	g.translate(0, 240);
	g.clearRect(0,0,40, 40);
	g.beginPath();
	g.moveTo(13,9);
	g.lineTo(7,17);
	g.lineTo(5,26);
	g.lineTo(12,32);
	g.lineTo(20,32);
	g.lineTo(26,36);
	g.lineTo(33,31);
	g.lineTo(32,19);
	g.lineTo(33,9);
	g.lineTo(24,8);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();



	// snowy terrain bits
	asset["snowy_terrain_bits"] = {
		offsetX : 50,
		offsetY : 240,
		width : 40,
		height : 40,
	}
	g.save();
	g.fillStyle = "#E8FFEE";
	g.lineWidth = 3;
	g.translate(50, 240);
	g.clearRect(0,0,40, 40);
	g.beginPath();
	g.moveTo(13,9);
	g.lineTo(7,17);
	g.lineTo(5,26);
	g.lineTo(12,32);
	g.lineTo(20,32);
	g.lineTo(26,36);
	g.lineTo(33,31);
	g.lineTo(32,19);
	g.lineTo(33,9);
	g.lineTo(24,8);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();


	// audio
	asset["lobby"] = {
		main : new Audio('asset/lobby_long.mp3'),
		play : function() {
			this.main.volume = 0.21;
			this.main.play();
		}
	}
	asset["lobby"].main.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	});



	return asset;
})();

})();