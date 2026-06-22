import { useState, useRef, useEffect,  } from 'react'
import { Socket } from 'socket.io-client';
import { userSocket } from '../../socket/webSocket';
import { addMessage, newUser } from '../redux/slice';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router';
import MoreInfo from '../components/MoreInfo';


function GlobalChat() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userName='', messages=[], users=[], theme,  } = useSelector(state=>state.chatApp);

  useEffect(()=>{
    if (userName === '' || !userName) {
    navigate('/login')
  }
  }, [userName]);

  const [typers, setTypers] = useState([]); // For Typing Indications
  const [ msg, setMsg] = useState('');
  const typingTimer = useRef(null);  //For DeBouncing (Typing Indications)
  const textareaRef = useRef(null);  //For Texarea's dynamic height
  const [sideBarView, setSideBarView] = useState(false);  //For SideBar Handling
  const openMoreInfo = ()=> setSideBarView('more-info');  //Sidebar Handler(opens sidebar)
  const closeSideBar = ()=> setSideBarView(null);   //Sidebar Handler(closes sidebar)

  function sendMsg(){
    if(msg.trim().length>0 && userSocket.connected){
      
      userSocket.emit('ChatMessage',
        {
          type: 'msg',
          id : `${Date.now()}${userName}`,
          sender : userName,
          ts : Date(),
          text : msg,
        });
    }
    setMsg('');

    if (textareaRef.current) {
    textareaRef.current.style.height = 'auto';
  }
  }
  
  useEffect(()=>{   //Socket_IO events
    //New User Joined Chat event
    userSocket.on('newUser', (users, msg)=>{
      users = users.filter((user)=>user!==userName);
      dispatch(newUser(users));
      dispatch(addMessage(msg));
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
    userSocket.on('userLeft', ({msg, users})=>{
      dispatch(addMessage(msg));
      dispatch(newUser(users));
      
    })
  return () => {
    userSocket.off('newUser');
    userSocket.off('msg');
    userSocket.off('typing');
    userSocket.off('stopTyping');
    userSocket.off('userLeft');
  };
  },[dispatch, ]);
  
  useEffect(()=>{ //DeBouncing ( Typing Indication )
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
              ? `${users.slice(0,4).join(', ')} and ${users.length-4 ===1
                ? `1 other is online`
                : `${users.length-4} others are online` }`

              : `${ users.length === 0 ? `0 online`:`${users.join(', ')} online`}`
              }
          </p>
        </div>
      </header>

      {/* Messages */}
      <main
      className={`flex-1 py-2 px-2 gap-2 overflow-y-auto overflow-x-hidden bg-chat-surface scrollbar-chat flex flex-col justify-end ` }>
        <div className='flex flex-col gap-2'>
            {
              messages &&
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
          ref={textareaRef}
          rows={1}
          placeholder='Type Your Message'
          className={` border border-chat-border bg-chat-input text-chat-input-text placeholder:text-chat-input-placeholder focus:outline-none  focus:border-chat-primary  flex-1  overflow-y-auto break-words px-3 py-2 scroll-none resize-none max-h-40 min-h-10 whitespace-pre-wrap break-words [overflow-wrap:anywhere] scroll-auto scrollbar-chat overflow-x-hidden`}
          value={msg}
          onChange={(e)=>{
            e.preventDefault();
            setMsg(e.target.value);
            resizeTextarea(e.target);
          }}
          >
          </textarea>
          <button
          className={`bg-chat-primary text-chat-text-inverse hover:bg-chat-primary-hover active:bg-chat-primary-active rounded-2xl px-5 py-2 font-medium`}
          onClick={sendMsg}>
            Send
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