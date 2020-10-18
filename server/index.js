const express = require('express');
const app = express();
const socketIO = require('socket.io');
const http = require('http')
const stringMath = require('string-math');
const server = http.createServer(app);
const path = require('path');
var io = socketIO(server); //Initialize new instance of socket.io by passing in the Http object
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname ,'/../public/index.html'));
});



function checkFunction(numCheck) {
   return numCheck >= 0 && (numCheck - Math.floor(numCheck)) === 0;
}

const numberGenerator = () => {
    var opTemplate = ['+', '*', '-', '/'];
    var numberArray = [];
    var opChoice = [];
    //Creating an array to store the operands.
    var opArray = [];
    var netEquation = new Array(9);

    //Computing function
    var computer = {
        '+': (x, y) => x + y,
        '*': (x, y) => x * y,
        '-': (x, y) => x - y,
        '/': (x, y) => x / y,
    };
    function count(arr, desiredNum){
        var counts = {};

        for (var i = 0; i < arr.length; i++) {
            var num = arr[i];
            counts[num] = counts[num] ? counts[num] + 1 : 1;
        }
        // console.log(counts);
        // console.log(desiredNum, ":",counts[desiredNum]);
        return counts[desiredNum];
    }
    //Generating the Numbers
    while (numberArray.length < 5) {
        var r = Math.round(Math.random() * 8 + 1);
        //If number is not already in the array, push the number.
        if (numberArray.indexOf(r)===-1) numberArray.push(r);
    }
    //Generating the numbers for the index of the operand
    while (opChoice.length < 4) {
        var r = Math.floor(Math.random() * 4);
        if (r === 4) r = 3;
        if (opChoice.indexOf(r) === -1) {
            opChoice.push(r);
            
        }
    }
    
    function checkFunction(numCheck) {
        return numCheck >= 0 && numCheck - Math.floor(numCheck) === 0;
    }
    var numIndex = 0;
    var opIndex = 0;
    //Insert numbers and operators into one array;
    for( i = 0; i < netEquation.length; i++){
        if(i%2 === 0){
            netEquation[i]=numberArray[numIndex];
            numIndex++;
        } else{
            netEquation[i]=opTemplate[opChoice[opIndex]];
            opIndex++;
        }
    };
    
    //Evaluate the entire equation.
    //Loop while the net answer is still negative and/or a decimal
    var indexToBeChanged = 1;
    
    
    while (!checkFunction(stringMath(netEquation.join("")))) {
        var randIndex = Math.floor(Math.random() * 4);
        netEquation[indexToBeChanged] = count(netEquation, opTemplate[randIndex]) <2 ?  opTemplate[randIndex]: opTemplate[(randIndex +1) %4];
        indexToBeChanged = (indexToBeChanged + 2) < 9 ? indexToBeChanged + 2: 1;
        console.log(netEquation.join(''), " line 95");
        
    };
    for(i = 1; i<netEquation.length; i+=2){
        opArray.push(netEquation[i]);
    }
    // console.log(netEquation.join(''), "\n");
    
    var answer = stringMath(netEquation.join(''));
    
    
    return [numberArray, opArray, answer];
}


let allIds = [];
var numUser = 0;
//Io refers to the httpServer socket refers to the current client's socket

io.on('connection', (socket) => {
    let userId = allIds.push(socket);
    console.log('A user just connected!!');
    //Listening on connection for incoming sockets
    // io.clients((error, clients) => {
    //     if (error) throw error;
    //     console.log(clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
    // });
    
    socket.broadcast.emit('A user connected with the id of ' + userId); //Send message to everyone but the sender
    socket.on('genNewNum', () =>{
        let [numberArray, opArray, answer] = numberGenerator();
        let numberSet = {
            numbers: numberArray,
            operators: opArray,
            answer: answer,
        };
        socket.broadcast.emit(numberSet);
    })
    socket.on('disconnect', () => {
        //On disconnect socket
        
        console.log('user disconnected');
        socket.broadcast.emit('A user disconnected');
    });


    socket.on('chat message', (msg) => {
        io.emit('chat message', msg); //Send to everyone including sender
    });
});
const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});
