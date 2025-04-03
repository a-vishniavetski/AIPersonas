import './App.css'
import ChatWindow from "./Chat/ChatWindow.jsx";
import {ChatHistory} from "./ChatHistory/ChatHistory.js";
import Menu from "./Menu/Menu.jsx";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {

  return (
    <Router>
        <Routes>
            <Route path="/" element={<Menu />} />
            <Route path="/ChatWindow" element={
                <div className="content">
                    <div className="chat-window" >
                        <ChatWindow />
                    </div >
                    <div className="chat-history" >
                        <ChatHistory />
                    </div >
                </div >
            } />
        </Routes>
    </Router>
  )
}

export default App
