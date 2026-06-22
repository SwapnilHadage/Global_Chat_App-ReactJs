import { createServer } from 'node:http';
import express from 'express';
import { Server } from "socket.io";

const app = express();
const server = createServer(app); // equivalent to app.listen()
const socketIoServer = new Server(server,{
  cors:{
    origin: '*',
  }
}) //Passing http server to socket

const ROOM = "globalChat";
let users = [];
socketIoServer.on("connection", (socketObj)=>{
  console.log('user loggedIN ',socketObj.id);

  socketObj.on('joinRoom', async (userName)=>{
    console.log(`${userName} is joining the group..`);
    
    await socketObj.join(ROOM);
    const isExist = users.find((user) => user === userName);
    if(!isExist) users.push(userName);
    const msg = {
        type : 'notify',
        id : `${Date.now()}${Math.random()}`,
        ts : Date(),
        text : `${users[users.length-1]} joined the chat`,
      }
    console.log(users);
    
    //send to All
    socketIoServer.to(ROOM).emit("newUser",
      users,
      msg,
    );

    //BroadCast ( send to all except to whose connection is this)
    //socketObj.to(ROOM).emit("newUser", userName);
  });

  //Msg 
  socketObj.on('ChatMessage', (msg)=>{
    console.log('recieced msg in server', msg);
    
    //Send to All
    socketIoServer.to(ROOM).emit('msg', msg);
    console.log('Send to All');
  })

  //Typing Indication
  socketObj.on('typing', (userName)=>{
  //Broadcast to others
    socketObj.to(ROOM).emit('typing', userName);
  })

  //Stop Typing Indication
  socketObj.on('stopTyping', (userName)=>{
    //Broadcast to others
    socketObj.to(ROOM).emit('stopTyping', userName);
  })
})

app.get('/', (req, res)=>{
  res.send('<h1>HellooO</h1>');
});


server.listen(4600, ()=>{
  console.log("Server Running at http://localhost:4600");
});