import { useState, useEffect, useRef } from 'react'
import './index.css'
import { Login, GlobalChat,  } from './pages';
import { Routes, Route, Outlet } from 'react-router';
import Layout from './Layout';
import { Toaster, } from 'react-hot-toast';


function App() {
  

  return (
    <>
      <Toaster position='top-right'/>
      <Routes>
      <Route element={<Layout/>}>
        <Route path='/login' element={<Login/>}/>
        <Route path='/' element={<GlobalChat/>}/>
      </Route>
    </Routes>
    </>
    
  )
}

export default App
