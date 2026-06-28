import { createSlice, } from '@reduxjs/toolkit'

const reducer = createSlice({
  name: 'chatApp',
  initialState : {
    userName : '',
    users : [],
    theme : 1,
    messages : [],
  },
  reducers : {
    addUser : (state, action)=>{
      state.userName = action.payload;
    },
    changeTheme : (state)=>{
      state.theme = !state.theme
    },
    addMessage : (state, action)=>{
      state.messages = [...state.messages, action.payload];
    },
    setUsers : (state, action)=>{
      
      state.users = action.payload.filter(user=>user!==this.state.userName);
    },
    newUser : (state, action)=>{
      const users = state.users;
      if(state.userName !== action.payload
        &&
        !users.includes(action.payload)){
        state.users = [...users, action.payload];
      }
    },
    clearMessages : (state)=>{
      state.messages = [];
    },

    userLeft : (state, action)=>{
      const user = action.payload;
      state.users = state.users.filter(u=> u!==user);
      console.log(state.users);
      
    },
    reset : (state)=>({
        userName : '',
        users : [],
        theme : 1,
        messages : [],
    })
    
  }
})

export  const { changeTheme, addMessage, addUser, newUser, clearMessages, reset, setUsers, userLeft,   } = reducer.actions;

export default reducer.reducer;