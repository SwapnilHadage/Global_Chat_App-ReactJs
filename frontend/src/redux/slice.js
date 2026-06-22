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
    newUser : (state, action)=>{
      state.users = [...action.payload];
    },
    clearMessages : (state)=>{
      state.messages = [];
    },
    
  }
})

export  const { changeTheme, addMessage, addUser, newUser, clearMessages,  } = reducer.actions;

export default reducer.reducer;