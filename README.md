# samplegameserver
c++ sample game server

client/ folder contains well, client files:<br/>
client.html => main page<br/>
game_replay.js => main game loop<br/>
command.js => command template object for inputs<br/>
sprite.js => sprite template object<br/>
menu.js => menu template object<br/>
queue.js => basic queue struture to store replay events<br/>


server/ folder<br/>
ServerWithLib.cpp => Source code for main server application<br/>

server.cpp => server source code (Socket / HTTP / Game Events instantiation)<br/>
event.cpp => event object class<br/>
template.cpp => template used for events<br/>

See it live at http://www.musimos.com/temp/client.html
