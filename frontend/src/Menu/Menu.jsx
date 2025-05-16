import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "./Menu.css";
import LoginModal from '../Auth/LoginModal/LoginModal';

const personas = [
  { name: 'Cleopatra', image: 'src/assets/personas/cleopatra.png' },
  { name: 'Beethoven', image: 'src/assets/personas/beethoven.png' },
  { name: 'Caesar', image: 'src/assets/personas/caesar.png' },
  { name: 'Hermione', image: 'src/assets/personas/hermione.png' },
  { name: 'Martin', image: 'src/assets/personas/martin.png' },
  { name: 'Newton', image: 'src/assets/personas/newton.png' },
  { name: 'Socrates', image: 'src/assets/personas/socrates.png' },
  { name: 'Spartacus', image: 'src/assets/personas/spartacus.png' },
  { name: 'Voldemort', image: 'src/assets/personas/voldemort.png' },
];

function Menu() {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  const handlePersonaClick = (personaName) => {
    // if (!localStorage.getItem('token')) {
    //   setShowLoginModal(true);
    // } else {
    //   navigate(`/ChatWindow/${personaName}`);
    // }
    navigate(`/ChatWindow/${personaName}`);
  };
  const handleAddPersonaClick = () => {
    if (!localStorage.getItem('token')) {
      setShowLoginModal(true);
    } else {
      navigate(`/AddPersona`);
    }
  };

  return (
    <div className="menu-container">
      <div className="header-text">
        <h2 className='typing'>Choose your character!</h2>
      </div>

      <div className="personas-list">
        {personas.map((persona) => (
          <div
            key={persona.name}
            className="persona-card cursor-pointer"
            onClick={() => handlePersonaClick(persona.name)}
          >
            <img src={`/personas/${persona.name.toLowerCase()}.png`} alt={persona.name} />
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

      {/* Modal rendered outside of the menu-container */}
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
}

export default Menu;