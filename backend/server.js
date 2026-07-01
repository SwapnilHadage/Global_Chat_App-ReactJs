import dotenv from "dotenv";
dotenv.config();

import { createServer, } from 'node:http';
import express from 'express';
import { Server } from "socket.io";
import { validateUsername } from "./utils/validateUsername.js";
import cors from "cors";


const PORT = process.env.PORT || 4600;
const CLIENT_URL = process.env.CLIENT_URL;
const NODE_ENV = process.env.NODE_ENV || "development";

const app = express();

app.use(cors({
  origin: CLIENT_URL,
  credentials: true,
}));


const server = createServer(app); // equivalent to app.listen()
const socketIoServer = new Server(server,{
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
}) //Passing http server to socket

const ROOM = "globalChat";
let users = [];
const msgCharsLimit = 500; //Max 500 character's msg text allowed

socketIoServer.on("connection", (socketObj)=>{
  let user = null;
  let hasLeft = false;
  console.log('New User Connected');

  const handleUserLeave = ()=>{
    if(!user || hasLeft) return;

    hasLeft = true;
    users = users.filter(u => u !== user);

    socketObj.leave(ROOM);
    socketObj.to(ROOM).emit('userLeft', {
      msg: {
        sender : 'server',
        type : 'notify',
        id : `${Date.now()}${Math.random()}${crypto.randomUUID()}`,
        ts : Date.now(),
        text : `${user} Left the chat`,
      },
      user: user,
    });

    console.log(user, 'left ');
  };
  
  socketObj.on('joinRoom', async (userName, callback=null)=>{
    const res = validateUsername(userName);
    const normalized = String(userName).toLowerCase();
    const isAvailable = !users.find((user) => user.toLowerCase() === normalized);
    if(!res.valid){
      callback?.({
        success: false,
        message: "Invalid Username",
      });
      return;
    }
    if(!isAvailable){
      callback?.({
        success: false,
        message: "Username Unavailable",
      });
      return;
    }

    console.log(`${userName} is joining the group..`);
    user = userName; // keep original casing for display
    hasLeft = false;
    await socketObj.join(ROOM);
    const isExist = users.find((user) => user.toLowerCase() === normalized);
    if(!isExist) users.push(userName);

    const msg = {
        sender: 'server',
        type : 'notify',
        id : `${Date.now()}${Math.random()}${crypto.randomUUID()}`,
        ts : Date.now(),
        text : `joined the chat`,
        user : user,
      }
    console.log(users);
    
    // Acknowledge the joining socket first so it reliably receives the users/msg
    if(callback){
      callback({
        success: true,
        users: users,
        msg: msg
      })
    }

    // Broadcast to others (send to all except the joining socket)
    socketObj.to(ROOM).emit("newUser", userName, msg );
  });

  //Msg
  socketObj.on('ChatMessage', (msg)=>{
    console.log('recieced msg in server', msg);
    
    //Send to All
    if(
      msg.sender === user &&
      users.includes(msg.sender.trim()) &&
      typeof msg.text==='string' &&
      msg.text.trim() &&
      msg.text.trim().length <= msgCharsLimit &&
      msg.type==='msg' &&
      msg.ts &&
      msg.id
    ){
      socketIoServer.to(ROOM).emit('msg', {
        id : `${user}${Date.now()}${crypto.randomUUID()}`,
        ts : Date.now(),
        sender : user,
        text : msg.text.trim(),
        type : "msg",
      });
      console.log('Send to All');
    }else{
      console.log('Failed to send');
      
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
    handleUserLeave();
  })

  socketObj.on('leaveChat',()=>{
    handleUserLeave();
  })
})

app.get('/', (req, res)=>{
  res.send('<h1>HellooO</h1>');
});


server.listen(PORT, ()=>{
  console.log(`Server Running ${PORT}`);
});