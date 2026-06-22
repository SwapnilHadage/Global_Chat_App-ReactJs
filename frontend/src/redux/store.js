import { configureStore } from '@reduxjs/toolkit';
import reducer from './slice';

const store = configureStore({
  reducer : {
    chatApp : reducer,
  },
  devTools : true,
});

export default store;