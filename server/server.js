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
var answer = 0;
var globalNumberArray = [];
let allUsers = [];
var numUsers = 0;
//Io refers to the httpServer socket refers to the current client's socket

var hostId = "";

var countdown = 61;
var timerID = true;
var currentUser;
io.on('connection', (socket) => {
    
    var addedUser = false;
    console.log('A user just connected!!');
    socket.broadcast.emit('userConnected');

    //Iterate through all rooms and get list of all sockets in there
    let rooms = io.sockets.adapter.rooms;
    for (let room of Object.keys(rooms)) {
        // console.log('room');
        // console.log('  ', rooms[room]);
        allSockets = getListOfSocketsInRoom(room);
    }

    //Client requests to add a new user.
    socket.on('addUser', (username) => {
        //Check if within this connection session, the user was already added
        if (addedUser) return;

        //If user is the first person to join, make them the host and log their id.
        if(numUsers === 0){
            socket.type = "host";
            hostId = socket.id;
            console.log("Host's Id is",hostId);
        } else{
            socket.type = 'client';
        }

        //Store username
        socket.username = username;
        socket.hasCorrectAnswer = false;
        //Array that stores the socket object for all sockets inside the network.
        allUsers.push(socket);
        allUsers.forEach(element => {
            console.log("ID: ",element.id, ": username: ",element.username)
        });
        ++numUsers;
        //Mark that user has been added then emit to everybody that a new dude joined.
        addedUser = true;
        socket.broadcast.emit('#userJoined', {
            username: socket.username,
            type: socket.type,
            numUsers: numUsers,
        });
        
    });

    //Start the game
    socket.on('gameStart', () => {
        if(socket.type !== 'host') {
            socket.emit('notHost');
            return;
        };
        allUsers.forEach((user) => {
            user.hasCorrectAnswer = false;
        })
        console.log('executing game start')
        //Randomizes first user
        currentUser = allUsers[Math.floor(Math.random()*(allUsers.length-1))]
        //Send to everyone that game is starting
        io.emit('gameStarting');
        io.emit('#firstUser', currentUser.username);
        socket.emit('#welcomeMessage',`Welcome ${socket.username}`);
        socket.score = 0;
        socket.emit('#score', socket.score);
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
        
        socket.emit('#sendingNumber', numberSet);
    });
 
    //Check Answer function
    socket.on('sendAnswer', (workingAnswer) => {
        socket.hasCorrectAnswer = false;
        socket.hasAnswered = true;
        if(countdown <= 1 ) {
            io.emit('timeout');
            return;
        }
        if( currentUser.id !== socket.id ) {
            io.emit('notCurrentUser');
            return;
        }
        
        console.log('The user guessed ' + workingAnswer);

        //Computes the returned answer.
        let guess = stringMath(workingAnswer);
        
        //Check if it matches the stored answer.
        if (guess === this.answer) {
            let answerIsWrong = false;
            console.log("global number array: ",globalNumberArray);
            //Check if the answer string uses all the require digits.
            for( i = 0; i < globalNumberArray.length; i++) {
                if(!(workingAnswer.includes(globalNumberArray[i].toString()))){
                    answerIsWrong = true;
                    console.log('answer is wrong');
                    socket.emit('wrongAnswer');
                    
                } 
            };
            if(!answerIsWrong) {
                var isLastUser = !allUsers.some((user) => {
                    //Negated, so true if all user has answered
                    return (
                        user.id !== socket.id && user.hasCorrectAnswer === false
                    ); //true if at least one user hasn't answered
                });
                ci.clearCorrectingInterval(timerID);
                socket.hasCorrectAnswer = true;
                socket.timeUsed = 60-countdown;
                socket.score += 1;
                console.log('answer is correct');
                socket.emit('#correctAnswer', {timeUsed: socket.timeUsed, score: socket.score});
                
                if(!isLastUser){
                    currentUser = allUsers.find((element)=>{
                        return (element.hasAnswered === false && element.id !== socket.id);
                    })
                    socket.emit('#nextUser', currentUser.id);
                }
                
                //Check if last person,
                if(isLastUser){
                //if so compare to other person's timer
                    var fastestSocket = {
                        id: socket.id,
                        time: socket.timeUsed,
                    };
                    //Find fastest socket.
                    allUsers.forEach((element) => {
                        if (element.timeUsed < fastestSocket.time && element.hasCorrectAnswer === true && element.timeUsed !== 0) {
                            fastestSocket.id = element.id;
                            fastestSocket.time = element.timeUsed;
                        }
                    });
                    if (fastestSocket.id === socket.id) { //User is fastest socket
                        socket.score += 1;
                        socket.emit('#scoreChanged', socket.score);
                        socket.emit('won', {timeUsed: socket.timeUsed, score: socket.score});
                    } else { //User is not fastest socket, tell other socket to add score.
                        io.to(fastestSocket.id).emit('addScore');
                    }
                }
            }

        } else {
            socket.emit('wrongAnswer');
            var fastestSocket = {
                        id: socket.id,
                        time: socket.timeUsed,
                    };
                    //Find fastest socket.
            allUsers.forEach((element) => {
                if (element.timeUsed < fastestSocket.time && element.hasCorrectAnswer === true && element.timeUsed !== 0) {
                    fastestSocket.id = element.id;
                    fastestSocket.time = element.timeUsed;
                }
            });
            io.to(fastestSocket.id).emit('addScore');
        }
        
    });
    socket.on('addScore', () => {
        socket.score += 1;
        socket.emit('#scoreChanged', socket.score);
        console.log(socket.score);
    })
    socket.on('reset', function() {
        if(socket.type !== 'host'){ 
            socket.emit('notHost');
            return
        };
        try {
            allUsers.forEach((element) => {
                element.timeUsed = 0;
                element.score = 0;
                element.hasCorrectAnswer = false;
                element.emit('resetSuccess', {timeUsed: element.timeUsed, score: element.score});
            });

            ci.clearCorrectingInterval(timerID);
            countdown = 61;
            timerID = true;
            
        } catch (error) {
            io.emit('resetError');
        } 
        
        
    });

    socket.on('startTimer', function() {
        socket.emit('timerStarting');
        if(timerID == true){
            timerID = ci.setCorrectingInterval(function() {
                countdown--;
                
                io.sockets.emit('#timer', { countdown: countdown });
                console.log(countdown);
                if(countdown<=1){
                    io.emit('timeout');
                    ci.clearCorrectingInterval(timerID);
                    countdown = 61;
                    timerID = true;
                }
            }, 1000);
        }
    });

    

    socket.on('disconnect', () => {
        //On disconnect socket
        if (addedUser) { 
            allUsers.splice(allUsers.indexOf(socket.username),1);
            --numUsers
        };
        console.log('user disconnected');
        socket.broadcast.emit('userDisconnected');
        socket.broadcast.emit('#numUsers', numUsers);
    });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
    console.log(`listening on port ${port}`);
});
