import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Whiteboard from './Whiteboard.jsx'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/board/:roomId" element={<Whiteboard />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
