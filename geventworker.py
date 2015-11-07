from socketio.sgunicorn import GeventSocketIOWorker

class MyGeventSocketIOWorker(GeventSocketIOWorker):
    policy_server = False