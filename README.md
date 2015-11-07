# NextStep

It is now up and running at [nextep.herokuapp.com](nextep.herokuapp.com)!

Description:
This is my first try on designing and implementing a multiplayer game architecture. 
The game concept and mechanism is very similar to Worms and Gunbound (and a "It looks like Gunbound!" is a great compliment
to this work). My hope is that a group of friends can find solace in playing it together, while relinquishing their thirst for
the nostalgic Gunbound high angle shots and attempts to make each other fall of the platform.

Implementation:
It was written using gevent-socketio and Socket.IO stack, and run on top of Gunicorn's GeventSocketIOServer.
Code is written with a prototyping spirit, hence to call the codes 'dirty' or 'messy' is an insult to the 
dirty and messy things in the world, this software does not even belong in that category anymore.

Current performance:
It is currently deployed on Heroku, and I have tested the game with some friends. I am happy to find that it at least works 
for a single room game, and across geographical location (SG-UK).

Name change:
It is supposed to be called NextStep, but since the app name is already taken at Heroku, it is changed to Nextep instead. 

Disclaimer:
Peace!

