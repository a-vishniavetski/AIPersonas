import React, { useState } from 'react';
import './ChatWindow.css';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // Handle message submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    setMessages([...messages, { text: input, sender: 'user' }]);

    // TODO Simulate bot response (placeholder)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        text: `Echo: ${input}`,
        sender: 'bot'
      }]);
    }, 500);

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
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
};

export default ChatWindow;