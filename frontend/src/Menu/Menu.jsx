import React, {useEffect, useState} from 'react';
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
  const [personas, setPersonas] = useState([]);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddPersonaModal, setShowAddPersonaModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
  const fetchUserPersonas = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch('https://localhost:8000/api/get_user_personas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch personas');
      }

      const data = await response.json();

      // Extract array of persona names
      const fetchedNames = data.persona_names.map(p => p.persona_name);

      // Create a Set of existing persona names for fast lookup
      const existingNames = new Set(initialPersonas.map(p => p.name));

      // Filter out already present personas and assign default image
      const newPersonas = fetchedNames
        .filter(name => !existingNames.has(name))
        .map(name => ({
          name,
          image: '/personas/default.png', // fallback image for user-created personas
        }));

      setPersonas([...initialPersonas, ...newPersonas]);
    } catch (error) {
      console.error('Error fetching personas:', error);
      setPersonas(initialPersonas); // fallback if request fails
    }
  };

  fetchUserPersonas();
}, []);

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
            <img 
            src={`https://localhost:8000/static/personas/${persona.name.toLowerCase()}.png`} 
            alt={persona.name} 
            onError={(e) => {  
              // Fallback to test_image if API image fails
              e.target.src = "https://localhost:8000/static/personas/test_image.png";
            }} />
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