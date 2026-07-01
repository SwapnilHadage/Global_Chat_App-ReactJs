import {useState, useEffect, } from 'react';
import { useSelector, useDispatch, } from 'react-redux';
import { changeTheme, clearMessages, reset, } from '../redux/slice';
import { FaAngleDown, FaAngleUp, MdDeleteForever, GrLogout, MdLightMode, MdDarkMode } from '../assets/reactIcons';
import { userSocket } from '../../socket/webSocket';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router';
import toast from 'react-hot-toast';
import { AiOutlineRollback, RiSettingsLine } from '../utils';


function MoreInfo({onClose}) {
  const { userName='', messages=[], users=[], theme,  } = useSelector(state=>state.chatApp);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [viewUsers, setViewUsers] = useState(false);
  const handleUsersView = ()=> setViewUsers((prev)=> !prev);

  const [viewSettings, setViewSettings] = useState(false);
  const handleViewSettings = ()=> setViewSettings((prev)=> !prev);

  const handleTheme= ()=> dispatch(changeTheme());
  const handleClearChat= async()=> {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You want to Clear Chat?',
      icon: 'question',
      cancelButtonText: 'No',
      confirmButtonText: 'Clear',
      showCancelButton: true,
      showConfirmButton: true,

    });

    if(res.isConfirmed){
      dispatch(clearMessages());
      toast.success("Cleared messages successfully!")
    }

    return
  };
  const handleLeaveChat= async()=> {
    const res = await Swal.fire({
      title: 'Are you sure?',
      text: 'You want to leave the chat?',
      icon: 'question',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Leave Chat',
      showCancelButton: true,
      showConfirmButton: true,
    });

    if(res.isConfirmed){
      userSocket.emit('leaveChat');
      userSocket.disconnect();
      dispatch(reset());
      navigate('/login');
    }

    return
  };

  return (
    <div className={`${theme?' dark ': ''}   w-dvw h-dvh  bg-transparent absolute flex justify-end`}
    >
      {/* Transparent div */}
      <div className={`flex-1 bg-black/50 relative`}
      aria-label='Close Sidebar'
      onClick={onClose}>
        <button
          aria-label='Close Sidebar'
          className={`absolute p-2 top-5 right-[-15px] rounded-2xl z-20 bg-chat-primary text-chat-text-inverse hover:bg-chat-primary-hover active:bg-chat-primary-active p-3 transition-colors duration-200`}
          onClick={(e)=>{
            e.stopPropagation();
            onClose();
          }}>
            <AiOutlineRollback/>
        </button>
      </div>

      <div className={`bg-chat-page w-[80%] h-dvh flex flex-col gap-5 font-sans text-chat-text relative text-chat-text overflow-y-auto overflow-x-auto scrollbar-chat`}
      >

        <nav className={`bg-chat-header  text-chat-header-text font-bold text-2xl border-b border-b-chat-divider`}>
          <div className={`px-7 py-4`}>
            <h1>
              GlobalChat
            </h1>
          </div>
        </nav>

        <div className={`px-7 flex flex-col gap-2`}>
          <div>
            Logged-in as {userName}
          </div>

          {/* Users */}
          <div className={`flex flex-col w-full cursor-pointer`}>
            <div className={`flex items-center gap-2`}
            onClick={handleUsersView}>
              <p>
                Online ({users.length + 1})
              </p>
              <div className={`size-[5px] rounded bg-green-500 shadow-lg shadow-green-500`}>
              </div>
              {
                !viewUsers ? <FaAngleUp/> : <FaAngleDown/>
              }
            </div>
            {
              viewUsers &&
              <ul>
                <li className={`px-3 text-chat-text-secondary`}
                key={'you'}>{userName} (You)</li>
              {
                users.length>0 && users.map((user, i)=>(
                  <li className={`px-3 text-chat-text-secondary`}
                  key={user}>{user}</li>
                ))
              }
            </ul>
            }
          </div>
          {/* Settings */}
          <div className={`flex flex-col cursor-pointer`}
          onClick={handleViewSettings}>
            <div className={`flex items-center gap-2`}>
              <p>
                Settings
              </p>
              <RiSettingsLine />
              {
                !viewSettings ? <FaAngleUp/> : <FaAngleDown/>
              }
            </div>
            {
              viewSettings &&
              <ul className={`px-3 `}>
                <li>
                  <button onClick={handleTheme}
                  aria-label='Change Theme'
                  className={`flex items-center gap-2`}>
                    <p>Theme</p>
                    <div>
                      {
                        theme ? <MdDarkMode/> : <MdLightMode/>
                      }
                    </div>
                  </button>
                </li>
                <li>
                  <button onClick={handleClearChat} 
                  aria-label='Clear Chats'
                  className={`flex items-center gap-2`}>
                    <p>Clear Chat</p>
                    <MdDeleteForever/>
                  </button>
                </li>
                <li>
                  <button onClick={handleLeaveChat}
                  aria-label='Leave Global-Chat'
                  className={`flex items-center gap-2`}>
                    <p>Leave Chat</p>
                    <GrLogout/>
                  </button>
                </li>
              </ul>
            }
          </div>
          {/* Notice */}
          <div className={`flex flex-col w-full `}>
            <p>Notice: </p>
            <div className={`px-3`}>
              <p>Messages are visible to everyone in this room.</p>
              <p>
                Do not share private information.
              </p>
              <p>
                Messages are visible to everyone online.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MoreInfo;