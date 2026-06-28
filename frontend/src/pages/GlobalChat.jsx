import { useState, useRef, useEffect,  } from 'react'
import { userSocket } from '../../socket/webSocket';
import { addMessage, newUser, userLeft, } from '../redux/slice';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import MoreInfo from '../components/MoreInfo';
import toast from 'react-hot-toast';
import { IoSendSharp } from '../utils';


function GlobalChat() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userName='', messages=[], users=[], theme,  } = useSelector(state=>state.chatApp);

  const [isConnected, setIsConnected] = useState(userSocket.connected);
  const hasConnectedBefore = useRef(false)
  useEffect(()=>{  //Connection and
    
    const handleConnect = ()=>{
      if(!hasConnectedBefore.current){
        toast.success('Connected');
        hasConnectedBefore.current = true;
      }else{
        if(userName){
          userSocket.emit('joinRoom', userName);
          toast.success('Reconnected');
        }else{
          toast.error('Username unavailable to reconnect. Please Login again!')
          navigate('/login');
        }
        
      }
      setIsConnected(true);
    };

    const handleDisconnect = (reason)=>{
      if(reason !== 'io client disconnect'){
        toast.error('Disconnected, Trying to reconnect');
        setIsConnected(false);
      }else{
        toast.success('Logged-Out');
        setIsConnected(false);
      }
      return;
    };

    const handleConnectError = () => {
      toast.error("Server unavailable");
    };

    userSocket.on('connect', handleConnect);
    userSocket.on('disconnect', handleDisconnect);
    userSocket.on('connect_error', handleConnectError);

    return ()=>{
      userSocket.off('connect', handleConnect);
      userSocket.off('disconnect', handleDisconnect);
      userSocket.off('connect_error', handleConnectError);
    };
  }, []);

  useEffect(()=>{
    if (userName === '' || !userName) {
      navigate('/login');
    }
  }, [userName, navigate]);

  const [typers, setTypers] = useState([]); // For Typing Indications
  const [ msg, setMsg] = useState('');
  const msgCharsLimit = 500 ////Max 500 character's msg text allowed
  const typingTimer = useRef(null);  //For DeBouncing (Typing Indications)
  const textareaRef = useRef(null);  //For Texarea's dynamic height
  const [sideBarView, setSideBarView] = useState(false);  //For SideBar Handling
  const openMoreInfo = ()=> setSideBarView('more-info');  //Sidebar Handler(opens sidebar)
  const closeSideBar = ()=> setSideBarView(null);   //Sidebar Handler(closes sidebar)

  function sendMsg(){
    if(!isConnected){
      toast.error('You are Offline');
      return;
    }
    if(!msg.trim()){
      return;
    }
    if(msg.length>msgCharsLimit){
      toast.error('You exceed maximum character limit!');
      return;
    }
      
    userSocket.emit('ChatMessage', {
      type: 'msg',
      id : `${Date.now()}${userName}`,
      sender : userName,
      ts : Date.now(),
      text : msg,
      });
    setMsg('');

    if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
    }
  }
  
  useEffect(()=>{   //Socket_IO events
    //New User Joined Chat event
    userSocket.on('newUser', (user, msg)=>{
      console.log(user);
      
      dispatch(newUser(user));
      dispatch(addMessage({
        ...msg,
        text : `${msg.user} ${msg.text}`,
      }));
      console.log(messages);
      
    })

    // message event
    userSocket.on('msg', (msg)=>{
      dispatch(addMessage(msg));
      console.log('msg recieved');
      
    });

    //typing event
    userSocket.on('typing', (TyperUserName) => {
      if (TyperUserName === userName) return;

      setTypers((prev)=>{
        const isExist = prev.find((typer) => typer === TyperUserName);
          if(!isExist){
            return [...prev, TyperUserName];
          }
          return prev;
      });
    });

    //stop typing event
    userSocket.on('stopTyping', (userName)=>{
      setTypers((prev)=>
        prev.filter((typer)=>typer!==userName)
      )
    })

    //User left
    userSocket.on('userLeft', (payload)=>{
      dispatch(addMessage(payload.msg));
      dispatch(userLeft(payload.user));
      console.log(payload.msg);
      console.log(payload.user);
      
      
    })
  return () => {
    userSocket.off('newUser');
    userSocket.off('msg');
    userSocket.off('typing');
    userSocket.off('stopTyping');
    userSocket.off('userLeft');
  };
  },[dispatch, userName ]);
  
  useEffect(()=>{ //DeBouncing ( Typing Indication )
    if(!isConnected) return;

    if(!msg.trim()){
      userSocket.emit('stopTyping', userName);
      return
    };

    if(msg){
      userSocket.emit('typing', userName);
      if(typingTimer.current) clearTimeout(typingTimer.current);
    }

    typingTimer.current = setTimeout(()=>{
      userSocket.emit('stopTyping', userName);
    }, 1500);

    return ()=>{
      if(typingTimer.current){
        clearTimeout(typingTimer.current);
      }
    };
  },[msg, userName, ])
  
  const handleTypingMsg = (e)=>{
    if(msg.length >= msgCharsLimit){
      toast.error('You Reached maximum character limit!');
    }else{
      setMsg(e.target.value);
      resizeTextarea(e.target);
    }
  }

  const bottomRef = useRef(null);
  useEffect(()=>{
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  },[messages]);

  const resizeTextarea = (textarea)=>{
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`
  }

  return (
    <div
    className={`${theme?' dark ': ''} bg-chat-page w-dvw h-dvh flex flex-col font-sans text-chat-text`}>
      <header
      className={`bg-chat-header flex flex-col justify-start px-5 py-4`}
      onClick={openMoreInfo}>
        <div className={`text-chat-header-text font-bold text-2xl `}>
          Global Chat
        </div>
      <div className={`w-full h-[40%] text-xs pl-2 text-chat-header-online`}>
          <p>
            {
              users.length>4
              ? `You, ${users.slice(0,4).join(', ')} and ${users.length-4 ===1
                ? `1 other`
                : `${users.length-4} others` }`

              : `${ users.length === 0 ? ` You `:`You, ${users.join(', ')} `}`
              }
          </p>
        </div>
      </header>

      {/* Messages */}
      <main
      className={`flex-1 py-2 px-2 gap-2 overflow-y-auto overflow-x-hidden bg-chat-surface scrollbar-chat flex flex-col justify-end ` }>
        <div className='flex flex-col gap-2'>
            {
              messages.length &&
              messages.map((msg, i)=>
                msg.type === 'msg' ?(
                <div
                  className={` rounded-xl overflow-hidden flex flex-col gap-0 max-w-[85%] md:max-w-[70%] px-4 py-2
                  ${msg.sender==userName ?
                    'ml-auto bg-chat-message-own text-chat-message-own-text justify-end':
                    'mr-auto bg-chat-message-other text-chat-message-other-text justify-start' }`}
                  key={msg.id}>
                  { msg.sender!==userName &&
                    <div className={`text-xs text-chat-sender`}>
                      {msg.sender}
                    </div>
                  }
                  <p className='text-base break-words'>
                    {msg.text}
                  </p>
                  <div className={`text-xs flex  ${msg.sender==userName?'text-chat-message-own-time justify-end':'text-chat-message-other-time justify-start'}`}>
                    {new Date(msg.ts).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div> ) :(
                  <div
                  className={`  rounded-xl overflow-hidden flex flex-col items-center justify-center gap-0 w-full px-4 py-1 `}
                  key={msg.id}>

                  <p className='text-xs break-words px-2 py-1 bg-chat-surface-elevated rounded-xl'>
                    {msg.text}
                  </p>
                  
                </div>
                )
              )
            }
            { //Typers notification
              typers.length>0 &&
              <div className={`flex items-center bg-chat-typing-bg text-chat-typing rounded-xl p-1 max-w-max`}>
                <p >
                  {
                    typers.length>4
                    ? `${typers.slice(0,4).join(', ')} and ${users.length-4 ===1 
                ? `1 other is typing...` 
                : `${users.length-4} others are typing...` } `
                    : `${typers.length===1
                      ? `${typers[0]} is typing...` 
                      : `${typers.join(', ')} are typing...` }`
                  }
                </p>
              </div>
            }
            <div ref={bottomRef}/>
        </div>

      </main>

      {/* Msg Input Field */}
      <div
      className={`flex items-center shrink-0 bg-chat-surface overflow-hidden gap-2 px-3 py-2 border-t border-chat-divider `}>
          <textarea
          aria-label='Type Your Message Here'
          ref={textareaRef}
          rows={1}
          placeholder='Type Your Message'
          className={` border border-chat-border bg-chat-input text-chat-input-text placeholder:text-chat-input-placeholder focus:outline-none  focus:border-chat-primary  flex-1  overflow-y-auto break-words px-3 py-2 scroll-none resize-none max-h-40 min-h-10 whitespace-pre-wrap break-words [overflow-wrap:anywhere] scroll-auto scrollbar-chat overflow-x-hidden`}
          value={msg}
          onKeyDown={(e)=>{
            if(e.key === 'Enter' && !e.shiftKey){
              e.preventDefault();
              sendMsg();
              return;
            }
          }}
          onChange={(e)=>{
            e.preventDefault();
            handleTypingMsg(e);
            
          }}
          >
          </textarea>
          <button
          aria-label='Send Message'
          disabled={!isConnected}
          className={`bg-chat-primary text-chat-text-inverse hover:bg-chat-primary-hover active:bg-chat-primary-active rounded-4xl p-3 font-medium flex items-center justify-center
          ${!isConnected ? 'opacity-50 cursor-not-allowed' : '' }`}
          onClick={sendMsg}>
            <IoSendSharp/>
          </button>
      </div>

      { // sidebar
        sideBarView === 'more-info' && (
          <MoreInfo
          onClose={closeSideBar}/>
        )
      }
    </div>
  )
}

export default GlobalChat