import { io } from 'socket.io-client';
import Swal from "sweetalert2";
import toast from 'react-hot-toast';
export const userSocket = io(
    'http://localhost:4600', {
      autoConnect : false,
      reconnection : true,
      reconnectionAttempts : 5,
      reconnectionDelay : 1000,
      
    });

userSocket.io.on("reconnect_failed", async () => {
  toast.dismiss("re-connection");
  toast.dismiss("connection");

  const res = await Swal.fire({
    title: "Unable to reconnect!",
    text: "Please try again later!",
    icon: "error",
    confirmButtonText: "Retry",
    showConfirmButton: true,
  });

  if (res.isConfirmed) {
    userSocket.connect();
  }
});