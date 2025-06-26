import React, { useState } from 'react';
import "./AddPersonaModal.css";
import PropTypes from "prop-types";

function AddPersonaModal({ onClose, onAddPersona }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('https://localhost:8000/api/new_persona', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
            persona_name: name,
            persona_description: description }),
      });

      if (response.ok) {
        // Add the new persona with a default image
        onAddPersona({ name, image: '/personas/default.png' });
        setName('');
        setDescription('');
        onClose();
      } else {
        console.error('Failed to create persona');
        alert('Failed to create persona. Please try again.');
      }
    } catch (error) {
      console.error('Error creating persona:', error);
      alert('An error occurred. Please try again.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Create New Persona</h2>
        <div className="form-container">
          <div className="form-group">
            <label htmlFor="persona-name">Persona Name</label>
            <input
              id="persona-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter persona name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="persona-description">Persona Description</label>
            <textarea
              id="persona-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Enter persona description"
              rows="4"
            />
          </div>
          <div className="form-actions">
            <button type="button" onClick={handleSubmit}>
              Create
            </button>
            <button type="button" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

AddPersonaModal.propTypes = {
  onClose: PropTypes.func,
  onAddPersona: PropTypes.func,
}
export default AddPersonaModal;