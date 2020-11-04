let socket = io();
socket.on('connect', () => {
    console.log('Connected to Server!');
    socket.emit('add user',"Anon");
    socket.on('genNewNum', () => {
        console.log(socket.score);
    })
    socket.on('sending number' , (numberSet)=> {
        console.log("Number set received");
    })

});
socket.on('disconnect', () => {
    console.log('Disconnected from Server!');
});

const button = document.getElementById('gameStart');
button.addEventListener('click', function (e) {
    socket.emit('gameStart');
    socket.emit('genNewNum');
    socket.emit('sendAnswer','10');
    console.log('user.score:');
    console.log(socket);
});