# samplegameserver
c++ sample game server

client/ folder contains well, client files:
client.html => main page
game_replay.js => main game loop
command.js => command template object for inputs
sprite.js => sprite template object
menu.js => menu template object
queue.js => basic queue struture to store replay events


server/ folder
ServerWithLib.cpp => Source code for main server application

server.cpp => server source code (Socket / HTTP / Game Events instantiation)
event.cpp => event object class
template.cpp => template used for events

See it live at http://www.musimos.com/temp/client.html
