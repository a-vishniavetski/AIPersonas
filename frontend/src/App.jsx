import './App.css'
import ChatWindow from "./Chat/ChatWindow.jsx";
import {ChatHistory} from "./ChatHistory/ChatHistory.js";

function App() {

  return (
    <>
      {/*<Header />*/}
      <div className="content">
          <div className="chat-window" >
              <ChatWindow />
          </div >
          <div className="chat-history" >
              <ChatHistory />
          </div >
      </div >
    </>
  )
}

export default App
