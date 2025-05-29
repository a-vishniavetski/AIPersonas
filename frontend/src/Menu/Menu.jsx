import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./Menu.css";
import LoginModal from '../Auth/LoginModal/LoginModal';
import AddPersonaModal from './AddPersonaModal/AddPersonaModal.jsx';

const initialPersonas = [
  { name: 'Cleopatra', image: '/personas/cleopatra.png' },
  { name: 'Beethoven', image: '/personas/beethoven.png' },
  { name: 'Caesar', image: '/personas/caesar.png' },
  { name: 'Hermione', image: '/personas/hermione.png' },
  { name: 'Martin', image: '/personas/martin.png' },
  { name: 'Newton', image: '/personas/newton.png' },
  { name: 'Socrates', image: '/personas/socrates.png' },
  { name: 'Spartacus', image: '/personas/spartacus.png' },
  { name: 'Voldemort', image: '/personas/voldemort.png' },
];

function Menu() {
  const [personas, setPersonas] = useState(initialPersonas);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddPersonaModal, setShowAddPersonaModal] = useState(false);
  const navigate = useNavigate();

  const handlePersonaClick = (personaName) => {
    navigate(`/ChatWindow/${personaName}`);
  };

  const handleAddPersonaClick = () => {
    if (!localStorage.getItem('token')) {
      setShowLoginModal(true);
    } else {
      setShowAddPersonaModal(true);
    }
  };

  const addNewPersona = (newPersona) => {
    setPersonas((prevPersonas) => [...prevPersonas, newPersona]);
  };

  return (
    <div className="menu-container glassmorphism-black">
      <div className="header-text">
        <h2 className="typing">Choose your character!</h2>
      </div>

      <div className="personas-list">
        {personas.map((persona) => (
          <div
            key={persona.name}
            className="persona-card cursor-pointer"
            onClick={() => handlePersonaClick(persona.name)}
          >
            <img src={persona.image} alt={persona.name} />
            <div className="persona-name">{persona.name}</div>
          </div>
        ))}
        <div
          className="persona-card cursor-pointer"
          onClick={handleAddPersonaClick}
        >
          <img src="/personas/plus.png" alt="Add Persona" />
          <div className="persona-name">Add Persona</div>
        </div>
      </div>

      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      {showAddPersonaModal && (
        <AddPersonaModal
          onClose={() => setShowAddPersonaModal(false)}
          onAddPersona={addNewPersona}
        />
      )}
    </div>
  );
}

export default Menu;