import { io } from 'socket.io-client'

export const userSocket = io(
    'http://localhost:4600', {
      autoConnect : false,
    });

