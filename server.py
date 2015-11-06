import os, random, time
from socketio import socketio_manage
from socketio.server import SocketIOServer
from socketio.namespace import BaseNamespace

class NextStepNamespace(BaseNamespace):
	_registry = {}
	_room = {}
	_room_counter = 0

	def initialize(self):
		NextStepNamespace._registry[id(self)] = self
		self.emit('connect')
		self.username = None
		self.current_room = None
		self.current_team = None

	def disconnect(self, *args, **kwargs):
		if self.current_room:
			self.on_exit_room()
		if self.username:
			self._broadcast('exit', self.username)
		del NextStepNamespace._registry[id(self)]
		super(NextStepNamespace, self).disconnect(*args, **kwargs)

	def on_login(self, username):
		if self.username:
			self._broadcast('exit', self.username)
		self.username = username
		self._broadcast('enter', username)
		self.emit('userid', {'userid' : id(self), 'username': username})
		#self.emit('users',
		#	[{'name':ns.username, 'id':id(ns)}
		#	 for ns in NextStepNamespace._registry.values()
		#	 if ns.username is not None])
		self.emit('rooms',
			[{'room_id':r['room_id'], 
			  'room_title':r['room_title'],
			  'game_type':r['game_type'],
			  'room_size':r['room_size'],}
			 for r in NextStepNamespace._room.values()
			 if r['status'] is 'ready' and r['room_size'] > len(r['member'])])

	def on_create_room(self, msg):
		NextStepNamespace._room_counter += 1
		self._room[NextStepNamespace._room_counter] = {
			'room_id' : NextStepNamespace._room_counter,
			'room_title' : msg['room_title'],
			'owner' : self,
			'game_type' : msg['game_type'],
			'member' : {id(self):self},
			'delay_accumulated' : 0,
			'status' : 'ready',
			'stack' : [],
			'room_size' : msg['room_size'],
			'wind_change_delta' : 5,
		}
		self.current_room = NextStepNamespace._room[NextStepNamespace._room_counter]
		self._broadcast('room_created', {'room_title': msg['room_title'], 'room_id': self.current_room['room_id'], 'owner': self.username, 'ownerid': id(self), 'room_size': msg['room_size'], 'game_type': msg['game_type']})
		if msg['game_type'] == 'team':
			self.current_team = 'A'
			self.emit('team_member', {'userid':id(self), 'team':self.current_team})

	def is_room_owner(self):
		return self.current_room and self.current_room['owner'] == self


	def on_exit_room(self):
		if not self.current_room:
			return
		if self.current_room['status'] == 'playing':
			self.remove_from_stack()
			self.sort_stack()
			self.broadcast_delay_stack();

		del self.current_room['member'][id(self)]
		if self.is_room_owner():
			if len(self.current_room['member']):
				new_owner = self.current_room['member'].itervalues().next()
				self.current_room['owner'] = new_owner
				self._broadcast('new_room_owner', {'userid': id(new_owner)})

		if not len(self.current_room['member']):
			del NextStepNamespace._room[self.current_room['room_id']]
			self._broadcast('room_destroyed', {'room_id': self.current_room['room_id']})
		self._broadcast_room('exit_room', {'username':self.username, 'userid':id(self)})
		self.current_room = None


	def on_join_room(self, room_id):
		if self.current_room:
			self.on_exit_room()
		if not room_id in NextStepNamespace._room:
			self.emit('join_failure', {'room_id' : room_id, 'status': 'Room is not found.'})
			return
		room = NextStepNamespace._room[room_id]
		if room['status'] == 'playing':
			self.emit('join_failure', {'room_id' : room_id, 'status': 'Room is already playing.'})
		if room['room_size'] <= len(room['member']):
			self.emit('join_failure', {'room_id' : room_id, 'status': 'Room is full.'})
		
		self.current_room = room
		room['member'][id(self)] = self
		self._broadcast_room('entered_room', {'username': self.username, 'userid': id(self)})
		self.emit('joined_room',
			{ 'room_id' : room_id, 
			  'room_title' : room['room_title'], 
			  'ownerid': id(room['owner']),
			  'member': [{'name': ns.username, 'id' : id(ns)}
			  			  for ns in self.current_room['member'].values()],
			  'game_type': room['game_type'],
			  'room_size': room['room_size'] })
		if room['game_type'] == 'team':
			self.initialize_team()
		

	def initialize_team(self):
		room = self.current_room
		a = self.total_team_a()
		b = len(room['member']) - a - 1
		if a <= b:
			self.current_team = 'A'
		else:
			self.current_team = 'B'
		self._broadcast_room('team_member', {'userid':id(self), 'team':self.current_team})
		self.emit('team_info', [{'userid': id(u), 'team': u.current_team}
								for u in self.current_room['member'].values()
								if u is not self])

	def on_join_team(self, team):
		room = self.current_room
		a = self.total_team_a()
		x = 0
		if team == 'A':
			x = a
		else:
			x = len(room['member']) - a
		if x < room['room_size']/2:
			self.current_team = team
			self._broadcast_room('team_member', {'userid': id(self), 'team':self.current_team})

	def total_team_a(self):
		room = self.current_room
		a = 0
		for m in room['member'].values():
			if m.current_team == 'A':
				a += 1
		return a

	def on_start_game(self):
		if not self.current_room:
			self.emit('start_game_failure')
			return
		room = self.current_room
		if room['room_size'] != len(room['member']):
			self._broadcast_room('start_game_failure', {})
			return
		room['status'] = 'playing'
		room['stack'] = [{'user':s, 'delay':0, 'has_moved':False} for s in room['member'].itervalues()]
		random.seed(int(time.time()))
		random.shuffle(room['stack'])
		room['owner'].emit('initialize')

	def on_initialize(self, data):
		self._broadcast_room('initial_values', data)
		if self.current_room['stack']:
			self._broadcast_room('turn', {'userid': id(self.current_room['stack'][0]['user'])})

	def on_turn_request(self):
		room = self.current_room
		self.check_winning_condition()
		if room['stack']:
			if self == room['stack'][0]['user']:
				room['delay_accumulated'] = 0
			self.emit('turn', {'userid': id(room['stack'][0]['user'])})

	def on_end_of_turn(self, msg):
		room = self.current_room
		room['delay_accumulated'] += msg['time_penalty'] * 10
		s = room['stack']
		for ud in s:
			if ud['user'] is not self:
				if ud['has_moved']:
					ud['delay'] -= 20 # waiting time discount
				continue
			ud['delay'] += room['delay_accumulated']
			ud['has_moved'] = True
		room['delay_accumulated'] = 0;
		self.sort_stack()
		self.broadcast_delay_stack()
		self._broadcast_room('force_update', {'userid': id(self), 'state': msg})

		#wind
		room['wind_change_delta'] -= 1;
		if room['wind_change_delta'] <= 0:
			room['wind_change_delta'] = 15
			power = random.randint(0,10)
			angle = random.randint(0,360)
			self._broadcast_room('wind_change', {'angle': angle, 'power': power});

		self.check_winning_condition()

		if s:
			self._broadcast_room('turn', {'userid': id(s[0]['user'])})

	def broadcast_delay_stack(self):
		room = self.current_room
		s = room['stack']
		delay_stack = {}
		for ud in s:
			delay_stack[id(ud['user'])] = ud['delay']
		self._broadcast_room('delay_stack', {'data':delay_stack})

	def sort_stack(self):
		room = self.current_room
		s = room['stack']
		for i in xrange(len(s)):
			j = i
			while j > 0 and s[j]['delay'] < s[j-1]['delay']:
				s[j], s[j-1] = s[j-1], s[j]
				j -= 1

	def on_current_snapshot(self, snapshot):
		self._broadcast_room('snapshot', {'userid':id(self), 'snapshot':snapshot})

	def on_player_death(self):
		self.remove_from_stack()
		self._broadcast_room('death', {'userid': id(self)})

	def check_winning_condition(self):
		room = self.current_room
		if room['game_type'] == 'squirmish':
			if len(room['stack']) == 1:
				self._broadcast_room('winner', {'userid': id(room['stack'][0]['user'])})
				room['status'] = 'ready'
		else:
			a = 0
			b = 0
			for p in room['stack']:
				if p['user'].current_team == 'A':
					a += 1
				else:
					b += 1
			if a == 0:
				self._broadcast_room('winner', {'team': 'B'})
				room['status'] = 'ready'
			elif b == 0:
				self._broadcast_room('winner', {'team': 'A'})
				room['status'] = 'ready'


	def remove_from_stack(self):
		if not self.current_room:
			return
		v = [s for s in self.current_room['stack'] if s['user'] != self]
		self.current_room['stack'] = v

	def on_player_shoot(self, shoot_info):
		room = self.current_room;
		if self == room['stack'][0]['user']:
			self.current_room['delay_accumulated'] += 200
		self._broadcast_room('player_shoot', {'userid': id(self), 'shoot_info': shoot_info})

	def on_player_use_item(self, item_info):
		room = self.current_room;
		if self == room['stack'][0]['user']:
			self.current_room['delay_accumulated'] += 200
		self._broadcast_room('player_use_item', {'userid': id(self), 'item_info': item_info})

	def on_message(self, msg):
		self._broadcast_room('message', {'userid':id(self), 'msg':msg})

	def _broadcast(self, event, msg):
		for s in NextStepNamespace._registry.values():
			if s.username:
				s.emit(event, msg)

	def _broadcast_room(self, event, msg):
		if self.current_room:
			for s in self.current_room['member'].values():
				s.emit(event, msg)

public = os.path.join(os.path.dirname(__file__), 'nextstep-client')

def service(environ, start_response):
	if environ['PATH_INFO'].startswith('/socket.io'):
		return socketio_manage(environ, {'/nextstep' : NextStepNamespace})
	else:
		return serve_file(environ, start_response)

def serve_file(environ, start_response):
	name = environ['PATH_INFO'].lstrip('/')
	pathname = os.path.abspath(os.path.join(public, name))
	if not os.path.exists(pathname):
		start_response('404 NOT FOUND', [])
		return
	start_response('200 OK', [('Content-Type', 'text/html')])
	with open(pathname) as fp:
		while True:
			chunk = fp.read(4096)
			if not chunk: break
			yield chunk

sio_server = SocketIOServer(
	('', 8080), service,
	policy_server = False)
sio_server.serve_forever()
