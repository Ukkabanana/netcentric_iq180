var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http); //Initialize new instance of socket.io by passing in the Http object

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

io.on("connection", (socket) => {
  //Listening on connection for incoming sockets
  console.log("a user connected");
  socket.broadcast.emit("A user connected"); //Send message to everyone but the sender

  socket.on("disconnect", () => {
    //On disconnect socket
    console.log("user disconnected");
    socket.broadcast.emit("A user disconnected");
  });
  //   socket.on("chat message", (msg) => { //User emitting a message
  //     console.log("message: " + msg);
  //   });
  socket.on("chat message", (msg) => {
    io.emit("chat message", msg); //Send to everyone including sender
  });
});

http.listen(3000, () => {
  console.log("listening on *:3000");
});
