import {useState, useEffect, } from 'react';
import { useSelector, useDispatch, } from 'react-redux';
import { changeTheme, clearMessages} from '../redux/slice';
import { FaAngleDown, FaAngleUp, MdDeleteForever, GrLogout, MdLightMode, MdDarkMode } from '../assets/reactIcons'

function MoreInfo({onClose}) {
  const { userName='', messages=[], users=[], theme,  } = useSelector(state=>state.chatApp);
  const dispatch = useDispatch();

  const [viewUsers, setViewUsers] = useState(false);
  const handleUsersView = ()=> setViewUsers((prev)=> !prev);

  const [viewSettings, setViewSettings] = useState(false);
  const handleViewSettings = ()=> setViewSettings((prev)=> !prev);

  const handleTheme= ()=> dispatch(changeTheme());
  const handleClearChat= ()=> dispatch(clearMessages());
  const handleLeaveChat= ()=> {};

  return (
    <div className={`${theme?' dark ': ''}  w-dvw h-dvh  bg-transparent absolute flex justify-end`}
    >
      {/* Transparent div */}
      <div className={`flex-1 bg-black/50 relative`}
      onClick={onClose}>
        <button
          className={`absolute p-2 top-5 right-[-15px] rounded-2xl z-20 bg-chat-primary text-chat-text-inverse hover:bg-chat-primary-hover active:bg-chat-primary-active p-2 transition-colors duration-200`}
          onClick={onClose}>
            Back
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
              <div className={`size-[5px] rounded bg-green-500 shadow-lg shadow-green-500`}>

              </div>
              <p>
                Online ({users.length})
              </p>
              {
                !viewUsers ? <FaAngleUp/> : <FaAngleDown/>
              }
            </div>
            {
              viewUsers &&
              <ul>
              {
                users && users.map((user, i)=>(
                  <li className={`px-3 text-chat-text-secondary`}>{user}</li>
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
              {
                !viewSettings ? <FaAngleUp/> : <FaAngleDown/>
              }
            </div>
            {
              viewSettings &&
              <ul className={`px-3 `}>
                <li>
                  <button onClick={handleTheme}
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
                  className={`flex items-center gap-2`}>
                    <p>Clear Chat</p>
                    <MdDeleteForever/>
                  </button>
                </li>
                <li>
                  <button onClick={handleLeaveChat}
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