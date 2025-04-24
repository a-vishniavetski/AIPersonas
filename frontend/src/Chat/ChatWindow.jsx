import React, { useEffect, useState } from 'react';
import {useParams} from "react-router-dom";
import './ChatWindow.css';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  var {persona_name} = useParams();
  var user_id = "NoneForNow";

  // Get user ID from localStorage
  const token = localStorage.getItem("token");

  const didRunOnce = React.useRef(false);  // flag for React development behavior (useEffect runs twice in dev, but we don't want that)
  useEffect(() => {
    if (didRunOnce.current) return; // Prevents the effect from running again
    didRunOnce.current = true; // Set the flag to true after the first run

    if (!token) {
      alert("You must be logged in to send messages");
      return;
    }
    if (!persona_name) {
      alert("You must select a persona to send messages");
      return;
    }
    
    // GET OR CREATE PERSONA AND RETURN ITS ID
    fetch("http://localhost:8000/api/add_persona", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: user_id,
        persona_name: persona_name,
        persona_description: persona_name,
      }),
      credentials: "include",
    })
    .then(res => res.json())
    .then(data => {
      console.log("Persona ID:", data.persona_id);
      // You can store persona_id if needed
      const persona_id = data.persona_id;
      user_id = data.user_id;
      persona_name = data.persona_name;
      console.log("Persona ID:", persona_id);
      console.log("User ID:", user_id);
      console.log("Persona name:", persona_name);
      console.log("Conversation ID:", data.conversation_id);
    })
    .catch(err => console.error("Persona creation failed:", err));
  }, [persona_name]);


  // Handle message submission
  const handleSubmit = async (e) => {

    e.preventDefault();
    if (!input.trim()) return;

    if (!token) {
      alert("You must be logged in to send messages");
      return;
    }

    // Add user message
    setMessages([...messages, { text: input, sender: 'user' }]);
    try {
      // First, save the message to database
      const saveResponse = await fetch(
        `http://localhost:8000/api/user_message`,
        {
          method: "POST",
          headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            prompt: input,
            persona: persona_name,
          }),
          credentials: "include", // Add this
        }
      );
  
      if (!saveResponse.ok) {
        console.error("Failed to save message");
      }

      // print saveresponse
      const saveResponseData = await saveResponse.json();
      console.log("Prompt saved:", saveResponseData);


      const response = await fetch(
          `http://127.0.0.1:8000/api/get_answer`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
                prompt: input,
                persona: persona_name
            })
      });

      if (response.status !== 200) {
        alert("shit happens");
        throw new Error(
          "Error while sending prompt",
        );
      }
      const data = await response.json();
      setTimeout(() => {
      setMessages(prev => [...prev, {
        text: data,
        sender: 'bot'
      }]);
    }, 500);

    } catch (err) {
      console.error("Błąd: ", err);
    }
    // TODO Simulate bot response (placeholder)
    // setTimeout(() => {
    //   setMessages(prev => [...prev, {
    //     text: `Echo: ${input}`,
    //     sender: 'bot'
    //   }]);
    // }, 500);

    setInput('');
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot window */}
      <div className="chatbot-window">
        <div className="chatbot-header">
          <h3>Chatbot</h3>
        </div>
        <div className="chatbot-messages">
          {messages.map((message, index) => (<div key={index} className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`} >{message.text}
          </div>
          ))}
        </div>
        <form className="chatbot-input" onSubmit={handleSubmit}>
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..."
          />
          <button type="submit">↑</button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;