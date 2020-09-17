const { randomInt } = require('crypto');
var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http); //Initialize new instance of socket.io by passing in the Http object

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/genNewNumber', (req, res) => {
  res.send(numberGenerator());
    
});

const numberGenerator = () => {
    var array= ["+","*","-","/"];
    var num1 = Math.round(Math.random()*10);
    var num2 = Math.round(Math.random()*10);
    var num3 = Math.round(Math.random()*10);
    var num4 = Math.round(Math.random()*10);
    var num5 = Math.round(Math.random()*10);
    var choice1 = Array.random
    return "" + num1 + " " + num2 + num3 + num4 + num5;
}

io.on('connection', (socket) => {
    //Listening on connection for incoming sockets
    console.log('a user connected');
    socket.broadcast.emit('A user connected'); //Send message to everyone but the sender

    socket.on('disconnect', () => {
        //On disconnect socket
        console.log('user disconnected');
        socket.broadcast.emit('A user disconnected');
    });
    //   socket.on("chat message", (msg) => { //User emitting a message
    //     console.log("message: " + msg);
    //   });
    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); //Send to everyone including sender
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});
