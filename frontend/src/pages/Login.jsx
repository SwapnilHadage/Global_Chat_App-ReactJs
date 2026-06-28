import { useState, useEffect,  } from 'react'
import { useNavigate } from 'react-router';
import { useDispatch, useSelector, } from 'react-redux';
import { addUser, newUser, addMessage, setUsers  } from '../redux/slice'
import { userSocket } from '../../socket/webSocket';
import toast from 'react-hot-toast';
import { validateUsername } from '../../../backend/utils';


function Login() {
  const navigate = useNavigate();
  const existingUserName = useSelector((state)=>state.chatApp.userName);
  useEffect(()=>{
    if (existingUserName.trim()) {
      navigate('/');
    }
  }, [existingUserName]);

  const [loginStatus, setLoginStatus] = useState('Enter Chat');
  //const [isConnected, setIsConnected] = useState(userSocket.connected);

  useEffect(()=>{
    userSocket.connect();

  },[]);

  const [userName, setUserName] = useState('');
  const dispatch = useDispatch();
  const { theme, users, messages, } = useSelector(state=>state.chatApp)

  useEffect(()=>{
    const handleConnectError = ()=>{
      toast.error("Server unavailable");
    }

    const handlRoomJoinSuccess = (users, msg)=>{
      users = users.filter((user)=>user!==userName);
      
      dispatch(setUsers(users));

      dispatch(addMessage({
        ...msg,
        text : `${msg.user===userName ? 'You' : msg.user } ${msg.text}`,
      }));
      console.log(messages);
    }

    userSocket.on('connect_error', handleConnectError);
    userSocket.on('roomJoinedSuccess', handlRoomJoinSuccess);

    return ()=>{
      userSocket.off('connect_error', handleConnectError);
      userSocket.off('roomJoinedSuccess', handlRoomJoinSuccess);
    }
  }, []);

  function handleEnter(){
    if(!userSocket.connected){
      toast.error('Server Closed');
      return;
    }

    if(loginStatus !== 'Enter Chat'){
      return;
    }
    const res = validateUsername(userName.trim());
    if( !res.valid ){
      toast.error(res.message);
      return;
    }

    setLoginStatus('Joining..');

    userSocket.emit('checkUserName',userName.trim());
    userSocket.once('checkUserName', (isOk)=>{

      if(isOk){
          userSocket
          .timeout(5000)
          .emit('joinRoom', userName, (err, response)=>{
          
            if (err) {
              // Server didn't acknowledge within 5 seconds
              toast.error("Request timed out");
              setLoginStatus("Enter Chat");
              return;
            }
            if(!response.success){
              toast.error(response.message);
              setLoginStatus("Enter Chat");
              return;
            }
            if(response.success){
              setLoginStatus('Joining');
              dispatch(addUser(userName));
              navigate('/');
            }
        });
      }else{
          setLoginStatus('Enter Chat')
          toast.error('UserName Unavailable');
      }
    });
    
  }

  useEffect(()=>{
    userSocket.on('newUser', (user, msg)=>{
      console.log(user);
      
      dispatch(newUser(user));
      dispatch(addMessage({
        ...msg,
        text : `${msg.user} ${msg.text}`,
      }));
      console.log(messages);
    });
    
    return () => {
      userSocket.off("newUser");
      userSocket.off('checkUserName');
    }
  },[dispatch]);


  return (
    <div className={`h-dvh w-dvw font-sans ${theme?' dark ':''} bg-chat-page flex flex-col justify-center items-center `}>

      <header className={`w-full  flex justify-start text-2xl font-bold border-b border-chat-border  items-center px-6 py-4 bg-chat-header text-chat-header-text `  }
      >Login
      </header>

      <main className={`flex-1 flex justify-center items-center m-0`}>
          <div className={`flex flex-col gap-6 items-center p-10 rounded-xl bg-chat-surface-elevated border border-chat-border shadow-lg max-w-md`}>
            <input type="text" placeholder='Enter Username'
            className={`text-chat-input-text bg-chat-input border border-chat-border placeholder:text-chat-input-placeholder focus:outline-none focus:ring-2 focus:ring-chat-input-ring  focus:border-chat-primary py-4 px-5 text-xl w-full rounded-xl outline-none`}
            disabled = {loginStatus!=='Enter Chat'}
            onKeyDown={(e)=>{
              if(e.key==='Enter'){
                handleEnter();
              }
            }}
            onChange={(e)=>{setUserName(e.target.value)}}
            />
            <button
            className={`bg-chat-primary text-chat-text-inverse hover:bg-chat-primary-hover active:bg-chat-primary-active rounded-xl  w-full p-2 transition-colors
    duration-200`}
            aria-label='Enter Global-Chat'
            disabled = {loginStatus!=='Enter Chat'}
            onClick={(e)=>{
              e.preventDefault();
              handleEnter();
            }}
            >{loginStatus}</button>
          </div>
      </main>
    </div>
  )
}

export default Login