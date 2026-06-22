import { useState, useRef, useEffect,  } from 'react'
import { useNavigate } from 'react-router';
import { useDispatch, useSelector, } from 'react-redux';
import { addUser, newUser,  } from '../redux/slice'
import { userSocket } from '../../socket/webSocket';


function Login() {
  const existingUserName = useSelector((state)=>state.chatApp.userName)
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { theme, } = useSelector(state=>state.chatApp)

  function handleEnter(){
    if(userName.trim().length){
      userSocket.connect();
      userSocket.once("connect", ()=>{
        userSocket.emit('joinRoom', userName);
      })
      dispatch(addUser(userName))
      navigate('/');
    }
  }

  useEffect(()=>{
    userSocket.on('newUser', (userName)=>{
      console.log(`${userName} is Joined the Chat..`);
      dispatch(newUser(userName));
    });
    
    return () => {
    userSocket.off("newUser",(userName)=>{
      console.log(`${userName} is Joined the Chat..`);
      dispatch(newUser(userName));
    })}
  },[dispatch])
  return (
    <div className={`h-dvh w-dvw font-sans ${theme?' dark ':''} bg-chat-page flex flex-col justify-center items-center `}>

      <header className={`w-full  flex justify-start text-2xl font-bold border-b border-chat-border  items-center px-6 py-4 bg-chat-header text-chat-header-text `  }
      >Login
      </header>

      <main className={`flex-1 flex justify-center items-center m-0`}>
          <div className={`flex flex-col gap-6 items-center p-10 rounded-xl bg-chat-surface-elevated border border-chat-border shadow-lg max-w-md`}>
            <input type="text" placeholder='Enter Username'
            className={`text-chat-input-text bg-chat-input border border-chat-border placeholder:text-chat-input-placeholder focus:outline-none focus:ring-2 focus:ring-chat-input-ring  focus:border-chat-primary py-4 px-5 text-xl w-full rounded-xl outline-none`}
            onChange={(e)=>{setUserName(e.target.value)}}
            />
            <button
            className={`bg-chat-primary text-chat-text-inverse hover:bg-chat-primary-hover active:bg-chat-primary-active rounded-xl  w-full p-2 transition-colors
    duration-200`}
            onClick={(e)=>{
              e.preventDefault();
              handleEnter();
            }}
            >Enter Chat</button>
          </div>
      </main>
    </div>
  )
}

export default Login