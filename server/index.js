
const express = require('express');
const app = express();
const socketIo = require('socket.io');
const http = require('http')
const server = http.createServer(app);
var io = socketIo(server); //Initialize new instance of socket.io by passing in the Http object

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get('/genNewNumber', (req, res) => {
    var [numberArray, opArray, answer] = numberGenerator();
    var stringSend = "";
    numberArray.forEach(element => {
        stringSend += element;
    });
    opArray.forEach(element => {
        stringSend += element;
    });
    stringSend += answer;
    res.send(stringSend);
});

function checkFunction(numCheck) {
   return numCheck >= 0 && (numCheck - Math.floor(numCheck)) === 0;
}

const numberGenerator = () => {
    var opTemplate= ["+","*","-","/"];
    var numberArray = [];
    var opChoice = [];
    while (numberArray.length < 5) {
        var r = Math.round(Math.random() * 8+1);
        if (numberArray.indexOf(r) === -1) numberArray.push(r);
        
    }
    
    while (opChoice.length < 4) {
        var r = Math.floor(Math.random() * 4);
        if(r === 4) r = 3;
        if (opChoice.indexOf(r) === -1) opChoice.push(r);
    }
    
    var opArray = new Array(4);
    var computer = {
      "+": (x,y) => x+y,
      "*": (x,y) => x*y,
      "-": (x,y) => x-y,
      "/": (x,y) => x/y
    }
    var answer = numberArray[0];
    for( i = 0; i < opArray.length; i++ ){
        opArray[i] = opTemplate[opChoice[i]];
        var temp = computer[opArray[i]](answer, numberArray[i+1]);
        while (!checkFunction(temp)) {
            opArray[i] = opTemplate[Math.floor(Math.random()*4)];
            var temp = computer[opArray[i]](answer, numberArray[i + 1]);
        }
        answer = temp;
    }
    console.log(answer);
    return [numberArray, opArray, answer];
}
var allIds = [];
io.on('connection', (socket) => {
    var userId = allIds.push(socket)
    console.log(userId);
    //Listening on connection for incoming sockets
    console.log('A user connected with the id of ' + userId);
    socket.broadcast.emit('A user connected with the id of ' + userId); //Send message to everyone but the sender

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
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});
