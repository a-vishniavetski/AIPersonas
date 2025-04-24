import React, { useState } from 'react';
import {useParams} from "react-router-dom";
import './ChatWindow.css';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const {persona_name} = useParams();

  // Handle message submission
  const handleSubmit = async (e) => {

    e.preventDefault();
    if (!input.trim()) return;

    // Get user ID from localStorage
    const token = localStorage.getItem("token");
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