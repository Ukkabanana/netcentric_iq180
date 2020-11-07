var socket = io();
socket.on('connect', () => {
    // console.log('changes');
    console.log('Connected to Server!');
    socket.emit('addUser',"Anon");
    socket.on('genNewNum', () => {
        console.log(socket.score);
    })
});
socket.on('disconnect', () => {
    console.log('Disconnected from Server!');
});

const button = document.getElementById('gameStart');
button.addEventListener('click', function (e) {
    console.log(socket.id);
    socket.emit('gameStart');
    socket.emit('genNewNum');
    
    
    // console.log(socket);
});
const resetButton = document.getElementById('resetBut');
resetButton.addEventListener('click', function (e) {
    socket.emit('reset');
});