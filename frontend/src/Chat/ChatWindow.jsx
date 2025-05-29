import React, { useEffect, useState } from 'react';
import { useRef } from 'react';
import {Link, useParams} from "react-router-dom";
import './ChatWindow.css';
import { Input, Button } from '@headlessui/react'
import { motion } from 'framer-motion';
import { downloadPDFConversation } from './ChatWindowsApi';
import { TemperatureKnob } from '../features/TemperatureKnob.jsx';
import { useAuthenticatedFetch } from './ChatWindowsApi';

// Placeholder until description is fetched from backend
const loremIpsum = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ";

const ChatWindow = () => {
  const authFetch = useAuthenticatedFetch();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  var {persona_name} = useParams();
  const [userId, setUserId] = useState(null);
  const [personaId, setPersonaId] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [temperature, setTemperature] = useState(0.1);
  // voice message by user
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const audioChunksRef = useRef([]);

  const [pendingPrompt, setPendingPrompt] = useState(null);

  const messagesEndRef = useRef(null);

  // Get user ID from localStorage
  const token = localStorage.getItem("token");

  const didRunOnce = React.useRef(false);  // flag for React development behavior (useEffect runs twice in dev, but we don't want that)

  const handleExportToPdf = () => {
    if (conversationId) {
      downloadPDFConversation(conversationId, token)
        .catch(error => {
          console.error('Error downloading PDF:', error);
          // Handle error (show notification to user, etc.)
          window.alert('Failed to download PDF. Please try again later.');
        });
    } else {
      console.error('No conversation ID available');
      // Handle case where conversation ID is not available
      window.alert("Can't download PDF right now. Please try again later.");
    }
  };

  useEffect(() => {
    if (didRunOnce.current) return; // Prevents the effect from running again
    didRunOnce.current = true; // Set the flag to true after the first run

    if (!persona_name) {
      alert("You must select a persona to send messages");
      return;
    }

    const createPersona = async () => {
      try {
        const response = await authFetch("https://localhost:8000/api/add_persona", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            persona_name: persona_name,
            persona_description: persona_name,
          }),
        });
        
        if (!response) return; // Request was handled (401 redirect)
        
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
          conversation_id: conversationId,
          temperature: temperature
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
    if (!input.trim()) return;
    // if (!token) return;

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

  // ——— User records voice message and results transcribed ———
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      mediaRecorder.stop();
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        setMediaRecorder(recorder);
        audioChunksRef.current = [];

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
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
            setInput(result.text); // ✅ Populate input with transcribed text
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
        <div className="description-body">{loremIpsum}</div>
      </div>
      <div className="persona-dialog glass-panel glassmorphism-black">
        <div className="persona-header">
          <img src={`/personas/${persona_name.toLowerCase()}.png`} alt={persona_name} />
          <h3 className='persona-title'>{ persona_name }</h3>
        </div>
        <div className="chatbot-messages" style={{ overflowY: 'auto', maxHeight: '400px' }}>
          {messages.map((message, index) => (<div key={index} className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`} >
                {message.text}
              </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form className="persona-input" onSubmit={handleSubmit}>
          <Input autoComplete="off" type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..."
          />
          <Button type="submit">↑</Button>
           <button
            type="button"
            onClick={toggleRecording}
            className={`mic-button ${isRecording ? 'recording' : ''}`}
            >
              🎙️
          </button>
        </form>
      </div>
      <div className="persona-settings">
        <Button className="button persona-settings-button" onClick={handleExportToPdf}>Export to PDF</Button>
        <Button className="button persona-settings-button">Clear chat</Button>
        <Button className="button persona-settings-button">Change persona</Button>

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
