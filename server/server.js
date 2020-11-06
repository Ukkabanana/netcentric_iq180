const express = require('express');
const app = express();
const socketIO = require('socket.io');
const http = require('http')
const stringMath = require('string-math'); //Treat a string as a math operation and return the answer
const server = http.createServer(app);
const path = require('path');
const publicPath = path.join(__dirname, '/../public/');
const ci = require('correcting-interval');
var io = socketIO(server); //Initialize new instance of socket.io by passing in the Http object
app.use(express.json());

app.use(express.static(publicPath));


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
        
    };
    for(let i = 1; i<netEquation.length; i+=2){
        opArray.push(netEquation[i]);
    }
    // console.log(netEquation.join(''), "\n");
    
    let answer = stringMath(netEquation.join(''));
    
    
    return [numberArray, opArray, answer, netEquation.join('')];
}
function getListOfSocketsInRoom(room) {
    let sockets = [];
    try {
        let socketObj = io.sockets.adapter.rooms[room].sockets;
        for (let id of Object.keys(socketObj)) {
            sockets.push(io.sockets.connected[id]);
        }
    } catch (e) {
        console.log(`Attempted to access non-existent room: ${room}`);
    }
    return sockets;
}
var countdown = 60;
var answer = 0;
var globalNumberArray = [];
let allUsers = [];
var numUsers = 0;
//Io refers to the httpServer socket refers to the current client's socket
var hostId = 0;
io.on('connection', (socket) => {
    //Get list of all sockets in the given room
    
    
    var addedUser = false;
    console.log('A user just connected!!');
    socket.broadcast.emit('A user connected');

    //Iterate through all rooms and get list of all sockets in there
    let rooms = io.sockets.adapter.rooms;
    for (let room of Object.keys(rooms)) {
        // console.log('room');
        // console.log('  ', rooms[room]);
        allSockets = getListOfSocketsInRoom(room);
    }

    //Listening on connection for incoming sockets
    // io.clients((error, clients) => {
    //     if (error) throw error;
    //     console.log(clients); // => [6em3d4TJP8Et9EMNAAAA, G5p55dHhGgUnLUctAAAB]
    // });

    //Client requests to add a new user.
    socket.on('add user', (username) => {
        if (addedUser) return;

        // we store the username in the socket session for this client
        if(numUsers === 0){
            socket.type = "host";
            hostId = socket.id;
            console.log("Host's Id is",hostId);
        } else{
            socket.type = 'client';
        }
        socket.username = username;
        allUsers.push(socket);
        allUsers.forEach(element => {
            console.log("ID: ",element.id, ": username: ",element.username)
        });
        ++numUsers;
        addedUser = true;
        // echo globally (all clients except sender) that a person has connected
        socket.broadcast.emit('A user joined', {
            username: socket.username,
            numUsers: numUsers,
        });
        socket.timeUsed = numUsers;
    });

    //Start the game
    socket.on('gameStart', () => {
        if(socket.type !== "host") return;
        var firstUser = allUsers[Math.floor(Math.random()*(allUsers.length-1))]
        io.emit('Game is Starting');
        io.emit(firstUser.username);
        socket.emit(`Welcome ${socket.username}`);
        socket.score = 0;

        //timer.start()
    });
    
    //Generate the random number function
    socket.on('genNewNum', () => {
        console.log('genning new Num');
        let [numberArray, opArray, answer, netEquation] = numberGenerator();
        globalNumberArray = numberArray;
        this.answer = answer; //from the var answer
        console.log('answer at gen new num ' + answer);
        var numberSet = {
            numbers: numberArray,
            answers: answer,
        };
        
        socket.emit('sending number', numberSet);
    });
 
    //Check Answer function
    socket.on('sendAnswer', (workingAnswer) => {
        
        //Check if timer has timeout
        //If timeout, don't accept answer
        //Check if user is current player, if not don't accept answer
        console.log('The user guessed ' + workingAnswer);
        let guess = stringMath(workingAnswer);
        
        if (guess === this.answer) {
            let answerIsWrong = false;
            console.log("global number array: ",globalNumberArray);
            for( i = 0; i < globalNumberArray.length; i++) {
                if(!(workingAnswer.includes(globalNumberArray[i]))){
                    answerIsWrong = true;
                    console.log('answer is wrong');
                    socket.emit('answer is wrong');
                    break;
                } 
            };
            if(!answerIsWrong) {
                //Check time
                //Record time
                console.log('answer is correct');
                socket.emit('answer is correct');
                socket.score += 1;
                //Check if last person, 
                //if so compare to other person's timer
                var fastestSocket = {
                    id: socket.id,
                    time: socket.timeUsed
                }
                
                allUsers.forEach(element => {
                    if(element.timeUsed < fastestSocket.time){
                        fastestSocket.id = element.id;
                        fastestSocket.time = element.timeUsed;
                    }
                });
                if(fastestSocket.id === socket.id){
                    socket.score += 1;
                } else {
                    socket.to(fastestSocket.id).emit('addScore');
                }
                //If other person time is faster emit a message so that other person can add score
            }
            //timer.stop()
        } else {
            socket.emit('answer is wrong');
        }
    });
    socket.on('addScore', () => {
        socket.score += 1;
    })
    socket.on('reset', function() {
        socket.score = 0;
        //timer.reset()
    });

    socket.on('startTimer', function() {
        countdown = 60;
        ci.setCorrectingInterval(function() {
            countdown--;
            io.sockets.emit('timer', { countdown: countdown });
        },1000);
    });
    

    socket.on('disconnect', () => {
        //On disconnect socket
        if (addedUser) { 
            allUsers.splice(allUsers.indexOf(socket.username),1);
            --numUsers
        };
        console.log('user disconnected');
        socket.broadcast.emit('A user disconnected');
        socket.broadcast.emit(numUsers);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});
