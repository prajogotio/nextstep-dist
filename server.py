import os

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
		self.emit('users',
			[{'name':ns.username, 'id':id(ns)}
			 for ns in NextStepNamespace._registry.values()
			 if ns.username is not None])

	def on_create_room(self, room_title):
		NextStepNamespace._room_counter += 1
		self._room[NextStepNamespace._room_counter] = {
			'room_id' : NextStepNamespace._room_counter,
			'room_title' : room_title,
			'owner' : self,
			'type' : 'duel',
			'member' : {id(self):self},
			'delay_accumulated' : 0,
			'status' : 'ready',
			'stack' : []
		}
		self.current_room = NextStepNamespace._room[NextStepNamespace._room_counter]
		self._broadcast('room_created', {'room_title': room_title, 'room_id': self.current_room['room_id'], 'owner': self.username, 'ownerid': id(self)})

	def is_room_owner(self):
		return self.current_room and self.current_room['owner'] == self

	def on_set_room_type(self, new_type):
		if not self.is_room_owner():
			return
		self.current_room['type'] = new_type
		self._broadcast_room('room_info_update', {'type':new_type})

	def on_set_room_terrain(self, new_terrain):
		if not self.is_room_owner():
			return
		self.current_room['type'] = new_terrain
		self._broadcast_room('room_info_update', {'terrain':new_terrain})

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
				new_owner.emit('appointed_owner')
				self._broadcast('room_info_update', {'owner': new_owner.username, 'userid': id(new_owner)})
			else:
				del NextStepNamespace._room[self.current_room['room_id']]
				self._broadcast('room_destroyed', {'room_id': self.current_room['room_id']})
		self._broadcast_room('exit_room', {'username':self.username, 'userid':id(self)})
		self.current_room = None


	def on_join_room(self, room_id):
		if self.current_room:
			self.on_exit_room()
		if NextStepNamespace._room[room_id]['status'] == 'playing':
			self.emit('join_failure', {'room_id' : room_id, 'status': 'Room is already playing.'})
		if not NextStepNamespace._room[room_id]:
			self.emit('join_failure', {'room_id' : room_id, 'status': 'Room is not found.'})
			return
		room = NextStepNamespace._room[room_id]
		self.current_room = room
		room['member'][id(self)] = self
		self._broadcast_room('entered_room', {'username': self.username, 'userid': id(self)})
		self.emit('joined_room',
			{ 'room_id' : room_id, 'room_title' : room['room_title'], 'ownerid': id(room['owner']),'member': [{'name': ns.username, 'id' : id(ns)}
			  for ns in self.current_room['member'].values()] })



	def on_start_game(self):
		room = self.current_room
		room['status'] = 'playing'
		room['stack'] = [{'user':s, 'delay':0} for s in room['member'].itervalues()]
		room['owner'].emit('initialize')

	def on_initialize(self, data):
		self._broadcast_room('initial_values', data)

	def on_turn_request(self):
		room = self.current_room
		if self == room['stack'][0]['user']:
			room['delay_accumulated'] = 0
		self.emit('turn', {'userid': id(room['stack'][0]['user'])})

	def on_end_of_turn(self, time_penalty):
		room = self.current_room
		room['delay_accumulated'] += time_penalty * 20
		s = room['stack']
		for ud in s:
			if ud['user'] is not self:
				continue
			ud['delay'] += room['delay_accumulated']
			break
		self.sort_stack()
		self.broadcast_delay_stack()
		
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
			self.current_room['delay_accumulated'] += 100
		self._broadcast_room('player_use_item', {'userid': id(self), 'item_info': item_info})

	def _broadcast(self, event, msg):
		for s in NextStepNamespace._registry.values():
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
