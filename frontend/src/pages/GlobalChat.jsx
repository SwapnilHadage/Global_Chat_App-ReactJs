import { useState, useRef, useEffect,  } from 'react'
import { userSocket } from '../../socket/webSocket';
import { addMessage, newUser, userLeft, setUsers, addUser } from '../redux/slice';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import {MoreInfo, Logo, } from '../components';
import toast from 'react-hot-toast';
import { IoSendSharp } from '../utils';
import Swal from "sweetalert2";


function GlobalChat() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userName='', messages=[], users=[], theme,  } = useSelector(state=>state.chatApp);

  const [isConnected, setIsConnected] = useState(userSocket.connected);
  // const hasConnectedBefore = useRef()
  useEffect(()=>{  //Connection and reconnection
    
    const handleConnect = ()=>{
      // if(!hasConnectedBefore.current){
      //   toast.success('Connected');
      //   hasConnectedBefore.current = true;
      // }else{
        if(userName){
          // Re-join the room and request server ack so we receive the users list and join msg
          userSocket.timeout(5000).emit('joinRoom', userName, (err, response)=>{
            if(err){
              console.error('Rejoin timed out or failed', err);
              toast.error('Rejoin failed', { id: "connection" });
              return;
            }
            if(!response?.success){
              toast.error(response?.message || 'Rejoin rejected', { id: "connection" });
              navigate('/login');
              return;
            }
            const { users: srvUsers = [], msg = {} } = response;
            dispatch(setUsers(srvUsers));
            if(msg && (msg.text || msg.type)){
              dispatch(addMessage({ ...msg, text: `You ${msg.text ?? ''}`.trim() }));
            }
            toast.success('Reconnected', { id: "re-connection" });
            setIsConnected(true);
          });
        }else{
          toast.error('Username unavailable to reconnect. Please Login again!', { id: "connection" });
          navigate('/login');
        }
      //}
    };

    const handleDisconnect = (reason)=>{
      if(reason !== 'io client disconnect'){
        toast.loading('Disconnected, Trying to reconnect', { id: "connection" });
        setIsConnected(false);
      }else{
        toast.success('Logged-Out');
        setIsConnected(false);
      }
      return;
    };

    const handleConnectError = () => {
      toast.dismiss("connection")
      toast.loading("Server unavailable", { id: "re-connection" });
    };

    const handleReconnectAttemptsDone = async() => {
      toast.dismiss("re-connection");
      toast.dismiss("connection");
      const res = await Swal.fire({
        title: 'Unable to reconnect!',
        text: 'Please try again later!',
        icon: 'question',
        confirmButtonText: 'Retry',
        showConfirmButton: true,
      });
      
      if(res.isConfirmed){
        userSocket.connect();
      }
      
      return
    }

    //Last Reconnect attempt failed
    userSocket.io.on("reconnect_failed", handleReconnectAttemptsDone);
    userSocket.on('connect', handleConnect);
    userSocket.on('disconnect', handleDisconnect);
    userSocket.on('connect_error', handleConnectError);

    return ()=>{
      userSocket.off('connect', handleConnect);
      userSocket.off('disconnect', handleDisconnect);
      userSocket.off('connect_error', handleConnectError);
      userSocket.io.off("reconnect_failed", handleReconnectAttemptsDone);
    };
  }, [userName, dispatch, navigate]);

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
      sender : userName,
      type: 'msg',
      id : `${Date.now()}${userName}${crypto.randomUUID()}`,
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
      if(msg.sender === 'server'){
        dispatch(newUser(user));
        dispatch(addMessage({
        ...msg,
        text : `${msg.user ?? ''} ${msg.text ?? ''}`.trim(),
      }));
      }
    })

    // message event
    userSocket.on('msg', (msg)=>{
      dispatch(addMessage(msg));
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
      if(payload.msg.sender === 'server'){
        dispatch(addMessage(payload.msg));
        dispatch(userLeft(payload.user));
      }else{
        console.log('Unauthorized notification');
      }
      
      
    })

  return () => {
    userSocket.off('newUser');
    userSocket.off('msg');
    userSocket.off('typing');
    userSocket.off('stopTyping');
    userSocket.off('userLeft');
  };
  },[dispatch, userName ]);
  
  const typingIndicationLimiter = useRef(true); //To provide 1.5s gap between two typing indications
  useEffect(()=>{ //DeBouncing ( Typing Indication )
    if(!isConnected) return;

    if(!msg.trim()){
      userSocket.emit('stopTyping', userName);
      return
    };

    if(msg){
      if(typingTimer.current){
        clearTimeout(typingTimer.current);
        typingTimer.current = null;
      }
      if(typingTimer.current === null){
        typingTimer.current = setTimeout(()=>{
          userSocket.emit('stopTyping', userName);
        }, 1500);
      }
      if(typingIndicationLimiter.current){
        userSocket.emit('typing', userName);
        typingIndicationLimiter.current = false;
        
        setTimeout(()=>{
          typingIndicationLimiter.current = true;
        }, 1500);
      }else{
        return;
      }
    }

    return ()=>{
      if(typingTimer.current){
        clearTimeout(typingTimer.current);
      }
    };
  },[msg, userName, ])
  
  const showToast = useRef(true);
  const handleTypingMsg = (e)=>{
    setMsg(e.target.value.slice(0, msgCharsLimit));

    if(e.target.value.length >= msgCharsLimit){
      if(showToast.current){
        toast.error('You Reached maximum character limit!');
        showToast.current= false;
        setTimeout(()=>{
          showToast.current = true;
        }, 5000);
      }
    }

    resizeTextarea(e.target);
    
  }

  const bottomRef = useRef(null);
  useEffect(()=>{
    bottomRef.current?.scrollIntoView({
      behavior: "instant",
    });
  },[messages]);

  const resizeTextarea = (textarea)=>{
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`
  }

  return (
    <div
    className={`${theme?' dark ': ''} bg-chat-page w-full h-dvh flex flex-col font-sans text-chat-text`}>
      <header
      className={`${sideBarView==='more-info' ? 'filter blur-[2px]' : ''}  bg-chat-header shrink-0 min-w-0 overflow-hidden flex flex-col justify-start px-1 py-4`}
      onClick={openMoreInfo}>
        <div className={`text-chat-header-text font-bold text-2xl flex items-center gap-1 `}>
          <Logo
            title="Global Chat"
            className="h-10 w-10 text-brand-mark"
          />
          <p>
            Global Chat
          </p>
        </div>
        <div className={`w-full h-[40%] text-xs pl-11 text-chat-header-online`}>
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
      className={`${sideBarView==='more-info' ? 'filter blur-[2px]' : ''}  flex-1 p-2 gap-2 overflow-y-auto overflow-x-hidden bg-chat-surface scrollbar-chat flex flex-col min-h-0 ` }>
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
                  key={msg.id ?? `msg-${i}`}>
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
                  key={msg.id ?? `notify-${i}`}>

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
      className={`${sideBarView==='more-info' ? 'filter blur-[2px]' : ''}  flex items-center shrink-0 bg-chat-surface overflow-hidden gap-2 px-3 py-2 border-t border-chat-divider `}>
          <textarea
          disabled = {!isConnected}
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