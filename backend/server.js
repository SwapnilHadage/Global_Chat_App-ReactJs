import { createServer, } from 'node:http';
import express from 'express';
import { Server } from "socket.io";
import { validateUsername } from '../frontend/src/utils';

const app = express();
const server = createServer(app); // equivalent to app.listen()
const socketIoServer = new Server(server,{
  cors:{
    origin: '*',
  }
}) //Passing http server to socket

const ROOM = "globalChat";
let users = [];
const msgCharsLimit = 500; //Max 500 character's msg text allowed

socketIoServer.on("connection", (socketObj)=>{
  let user = null;
  console.log('New User Connected');
  
  socketObj.on('checkUserName', (userName)=>{
    const res = validateUsername(userName);

    const isOk = !users.find((user) => user===userName.toLowerCase() ) && res.valid;
    socketObj.emit('checkUserName', isOk);
  });


  socketObj.on('joinRoom', async (userName, callback=null)=>{
    if(!userName || !userName.trim()){
      callback?.({
        success: false,
        message: "Invalid username",
      });
      return;
    }

    console.log(`${userName} is joining the group..`);

    user = userName.toLowerCase();
    await socketObj.join(ROOM);
    const isExist = users.find((user) => user === userName);
    if(!isExist) users.push(userName.toLowerCase());

    const msg = {
        type : 'notify',
        id : `${Date.now()}${Math.random()}`,
        ts : Date.now(),
        text : `joined the chat`,
        user : user,
      }
    console.log(users);
    
    //send to All
    socketIoServer.to(ROOM).emit("roomJoinedSuccess", users, msg );

    //BroadCast ( send to all except to whose connection is this)
    socketObj.to(ROOM).emit("newUser", userName, msg );

    if(callback){
      callback({
        success: true
      })
    }
  });

  //Msg
  socketObj.on('ChatMessage', (msg)=>{
    console.log('recieced msg in server', msg);
    
    //Send to All
    if(
      msg.sender === user &&
      typeof msg.text==='string' &&
      msg.text.trim() &&
      msg.text.length < msgCharsLimit &&
      msg.type==='msg' &&
      msg.ts &&
      msg.id
    ){
      socketIoServer.to(ROOM).emit('msg', msg);
      console.log('Send to All');
    }
  });

  //Typing Indication
  socketObj.on('typing', (userName)=>{
  //Broadcast to others
    socketObj.to(ROOM).emit('typing', userName);
  });

  //Stop Typing Indication
  socketObj.on('stopTyping', (userName)=>{
    //Broadcast to others
    socketObj.to(ROOM).emit('stopTyping', userName);
  });

  //Discconect
  socketObj.on('disconnect',()=>{
    handleUserLeave(socketObj, user);
  })

  socketObj.on('leaveChat',()=>{
    handleUserLeave(socketObj, user);
  })
})

app.get('/', (req, res)=>{
  res.send('<h1>HellooO</h1>');
});


server.listen(4600, ()=>{
  console.log("Server Running at http://localhost:4600");
});

function handleUserLeave(socketObj, user){
  if(user){
    users = users.filter(u => u !== user);

    socketObj.to(ROOM).emit('userLeft', {
      msg: {
        type : 'notify',
        id : `${Date.now()}${Math.random()}`,
        ts : Date(),
        text : `${user} Left the chat`,
      },
      user: user,
    });

    console.log(user, 'left ');
  }
}