import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import { Link, useParams } from "react-router-dom";
import './ChatWindow.css';
import { Input, Button } from '@headlessui/react';
import { motion } from 'framer-motion';
import { downloadPDFConversation } from './ChatWindowsApi';
import { TemperatureKnob } from '../features/TemperatureKnob.jsx';
import { useAuthenticatedFetch } from './ChatWindowsApi';

const ChatWindow = () => {
  const authFetch = useAuthenticatedFetch();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { persona_name } = useParams();
  const [userId, setUserId] = useState(null);
  const [personaId, setPersonaId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [temperature, setTemperature] = useState(0.1);
  const [messageLoading, setMessageLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioChunksRef = useRef([]);
  const [pendingPrompt, setPendingPrompt] = useState(null);
  const messagesEndRef = useRef(null);
  const token = localStorage.getItem("token");
  const didRunOnce = React.useRef(false);

  // States for persona description
  const [description, setDescription] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [newDescription, setNewDescription] = useState('');

  const handleExportToPdf = () => {
    if (conversationId) {
      downloadPDFConversation(conversationId, token)
        .catch(error => {
          console.error('Error downloading PDF:', error);
          window.alert('Failed to download PDF. Please try again later.');
        });
    } else {
      console.error('No conversation ID available');
      window.alert("Can't download PDF right now. Please try again later.");
    }
  };

  useEffect(() => {
    if (didRunOnce.current) return;
    didRunOnce.current = true;

    if (!persona_name) {
      alert("You must select a persona to send messages");
      return;
    }

    const createPersona = async () => {
      try {
        const response = await authFetch("https://localhost:8000/api/add_persona", {
          method: "POST",
          headers: {"Content-Type": "application/json"},
          body: JSON.stringify({
            user_id: userId,
            persona_name: persona_name,
            persona_description: persona_name,
          }),
        });
        if (!response) return;
        const data = await response.json();
        console.log("Persona ID:", data.persona_id);
        setPersonaId(data.persona_id);
        setUserId(data.user_id);
        setConversationId(data.conversation_id);
      } catch (err) {
        console.error("Persona creation failed:", err);
      }
    };
    createPersona();
  }, [token, persona_name, authFetch]);

  // Fetch persona description when personaId is available
  useEffect(() => {
    if (personaId === null) return;

    const fetchDescription = async () => {
      try {
        const res = await authFetch(`https://localhost:8000/api/get_persona_description/${personaId}`);
        if (!res) return;
        const data = await res.json();
        setDescription(data.description);
      } catch (err) {
        console.error('Error fetching persona description:', err);
      }
    };
    fetchDescription();
  }, [personaId, authFetch]);

  useEffect(() => {
    if (conversationId === null || userId === null) return;

    (async () => {
      try {
        const res = await fetch('https://localhost:8000/api/chat_history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include',
          body: JSON.stringify({conversation_id: conversationId})
        });
        if (!res.ok) {
          console.error('Failed to load history', await res.text());
          return;
        }
        const history = await res.json();
        setMessages(Array.isArray(history) ? history : history.messages || []);
      } catch (err) {
        console.error('Error fetching chat history:', err);
      }
    })();
  }, [conversationId, userId, token]);

  useEffect(() => {
    if (pendingPrompt === null || conversationId === null || personaId === null || userId === null) return;

    (async () => {
      const prompt = pendingPrompt;
      setPendingPrompt(null);
      const res = await fetch('https://localhost:8000/api/get_answer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt,
          persona: persona_name,
          conversation_id: conversationId,
          temperature: temperature
        }),
        credentials: 'include'
      });
      const answer = await res.json();
      setMessages(msgs => [...msgs, { text: answer, sender: 'bot' }]);
    })();
  }, [pendingPrompt, conversationId, personaId, token]);

  const handleSubmit = e => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(msgs => [...msgs, { text: input, sender: 'user' }]);
    setPendingPrompt(input);
    setInput('');
  };

  useEffect(() => {
    if (messages.length === 0) return;
    if (messages[messages.length-1].sender === 'user') {
      setMessageLoading(true);
    } else {
      setMessageLoading(false);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const formData = new FormData();
          formData.append("file", audioBlob, "recording.m4a");
          setIsTranscribing(true);
          try {
            const res = await fetch("https://localhost:8000/transcribe", {
              method: "POST",
              body: formData
            });
            const result = await res.json();
            setInput(result.text);
          } catch (err) {
            console.error("Transcription failed:", err);
            alert("Failed to transcribe. Please try again.");
          } finally {
            setIsTranscribing(false);
          }
        };
        recorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Microphone access denied:", err);
        alert("Microphone access is required.");
      }
    }
  };

  const handleSaveDescription = async () => {
    try {
      const res = await authFetch('https://localhost:8000/api/update_persona_description', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          persona_id: personaId,
          new_description: newDescription,
        }),
      });
      if (!res) return;
      if (res.ok) {
        setDescription(newDescription);
        setIsEditing(false);
      } else {
        console.error('Failed to update description');
      }
    } catch (err) {
      console.error('Error updating description:', err);
    }
  };

  const TypingIndicator = () => (
    <div className="typing-indicator">
      <span className="dot" />
      <span className="dot" />
      <span className="dot" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="chatwindow-container"
    >
      <div className="persona-description glass-panel glassmorphism-black">
        <div className="description-header">Description</div>
        {isEditing ? (
          <div style={{height: 200, width: 300, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <textarea className="glass-panel glassmorphism-black"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={5}
              style={{ height: 120, width: '95%', marginBottom: '5px'}}
            />
            <div>
              <Button onClick={handleSaveDescription} style={{margin: '5px'}}>Save</Button>
              <Button onClick={() => setIsEditing(false)} style={{margin: '5px'}}>Cancel</Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="description-body">{description || 'Loading description...'}</div>
            <Button onClick={() => { setNewDescription(description); setIsEditing(true); }}>Edit</Button>
          </div>
        )}
      </div>
      <div className="persona-dialog glass-panel glassmorphism-black">
        <div className="persona-header">
          <Link to={`/profile/${persona_name}`} className="persona-link">
            <img src={`https://localhost:8000/static/personas/${persona_name.toLowerCase()}.png`} alt={persona_name} />
          </Link>
          <h3 className='persona-title'>{ persona_name }</h3>
        </div>
        <div className="chatbot-messages" style={{ overflowY: 'auto', maxHeight: '400px' }}>
          {messages.map((message, index) => (
            <div key={index} className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}>
              {message.text}
            </div>
          ))}
          {messageLoading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
        <form className="persona-input" onSubmit={handleSubmit}>
          <Input
            autoComplete="off"
            type="text"
            disabled={messageLoading}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
          />
          <Button type="submit" disabled={messageLoading}>↑</Button>
          <button
            type="button"
            onClick={toggleRecording}
            disabled={messageLoading}
            className={`mic-button ${isRecording ? 'recording' : ''}`}
          >
            🎙️
          </button>
        </form>
      </div>
      <div className="persona-settings">
        <Button className="button persona-settings-button" onClick={handleExportToPdf}>Export to PDF</Button>
        <Link to={`/profile/${persona_name}`} className="persona-link">
          <Button className="button persona-settings-button">Persona Profile</Button>
        </Link>
        <div style={{ margin: '20px 0', textAlign: 'center' }}>
          <label style={{ color: 'red', marginBottom: '8px', display: 'block' }}>Creativity</label>
          <TemperatureKnob value={temperature} onChange={setTemperature} />
        </div>
      </div>
      {isTranscribing && (
        <div className="overlay-spinner">
          <div className="spinner"></div>
        </div>
      )}
    </motion.div>
  );
};

export default ChatWindow;