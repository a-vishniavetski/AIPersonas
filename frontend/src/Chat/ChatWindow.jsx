import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import {Link, useParams} from "react-router-dom";
import './ChatWindow.css';

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  var {persona_name} = useParams();
  const [userId, setUserId] = useState(null);
  const [personaId, setPersonaId] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const [pendingPrompt, setPendingPrompt] = useState(null);

  const messagesEndRef = useRef(null);

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
    fetch("https://localhost:8000/api/add_persona", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: userId,
        persona_name: persona_name,
        persona_description: persona_name,
      }),
      credentials: "include",
    })
    .then(res => res.json())
    .then(data => {
      console.log("Persona ID:", data.persona_id);
      // You can store persona_id if needed
      setPersonaId(data.persona_id);
      setUserId(data.user_id);
      setConversationId(data.conversation_id);
      // console.log("Conversation ID:", conversationId);
      // console.log("User ID:", userId);
      // console.log("Persona ID:", personaId);
      // console.log("Persona name:", persona_name);
    })
    .catch(err => console.error("Persona creation failed:", err));
  }, [token, persona_name]);

    // ——— LOAD HISTORY ———
  useEffect(() => {
    if (conversationId === null || userId === null) {
      return;  // wait until both IDs are available
    }

    (async () => {
      try {
        const res = await fetch('https://localhost:8000/api/chat_history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({
            conversation_id: conversationId,
          })
        });

        if (!res.ok) {
          console.error('Failed to load history', await res.text());
          return;
        }

        const history = await res.json();
        console.log('Chat history:', history);
        setMessages(Array.isArray(history) ? history : history.messages || []);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    })();
  }, [conversationId, userId, token]);


  useEffect(() => {
    if (pendingPrompt === null || conversationId === null || personaId === null || userId === null) {
      return;            // bail until we have both
    }

    console.log("Conversation ID:", conversationId);
    console.log("User ID:", userId);
    console.log("Persona ID:", personaId);
    (async () => {
      // immediately clear it so this effect won’t re-fire
      const prompt = pendingPrompt;
      setPendingPrompt(null);
      console.log("Prompt:", prompt);
      // send to your get_answer endpoint
      const res = await fetch('https://localhost:8000/api/get_answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          persona: persona_name,
          conversation_id: conversationId
        }),
        credentials: 'include'
      });
      const answer = await res.json();
      setMessages(msgs => [...msgs, { text: answer, sender: 'bot' }]);
    })();
  }, [pendingPrompt, conversationId, personaId, token]);

  // ——— on form submit, push user message and trigger pendingPrompt ———
  const handleSubmit = e => {
    e.preventDefault();
    if (!input.trim() || !token) return;

    // add user’s message
    setMessages(msgs => [...msgs, { text: input, sender: 'user' }]);
    // hand off to the effect above
    setPendingPrompt(input);
    setInput('');
  };

    // ——— scroll to bottom on new messages ———
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="chatbot-container">
      {/* Chatbot window */}
      <div className="chatbot-window">
        <Link to="/">
        <button className="bg-blue-500 text-white p-2 rounded mt-2 mr-2">
          Go to Main Page
        </button>
      </Link>
        <div className="chatbot-header">
          <h3>Chatbot</h3>
        </div>
        <div className="chatbot-messages" style={{ overflowY: 'auto', maxHeight: '400px' }}>
          {messages.map((message, index) => (<div key={index} className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`} >{message.text}
          </div>
          ))}
          <div ref={messagesEndRef} />
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