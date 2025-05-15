import React from 'react';
import { Link } from 'react-router-dom';
import "./Menu.css";

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
    return (
        <>
            <div className="menu-container">

                <div className="header-text">
                    <h1 style={{ fontFamily: 'Batman' }}>Choose your character!</h1>
                </div>

                <div className="personas-list">
                    {personas.map((persona) =>  (
                        <Link key={persona.name} to={`/ChatWindow/${persona.name}`} className="persona-card">
                            <img src={persona.image} alt={persona.name} />
                            <div className='persona-name'>{persona.name}</div>
                        </Link>
                    ))}
                    <Link to="AddPersona" className="persona-card">
                        <img src="src/assets/personas/plus.png" alt="Add Persona" />
                        <div className='persona-name'>Add Persona</div>
                    </Link>
                </div>
            </div>
        </>
    );
}

export default Menu;