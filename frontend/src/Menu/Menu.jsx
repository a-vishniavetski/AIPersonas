import React, { useState } from 'react';
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
    const [isOpen, setIsOpen] = useState(false);
    const [personasName, setPersonasName] = useState("");
    const [personasDesc, setPersonasDesc] = useState("");

    const addPersona = () => {
        setIsOpen(true);
    };

    const acceptPersona = async (e) => {
        e.preventDefault();

        try {
            console.log("TRYING");
            const response = await fetch("https://localhost:8080/api/add_persona", {
                method: "POST",
                body: JSON.stringify({
                    user_id: "example",
                    persona_name: personasName,
                    persona_description: personasDesc,
                }),
            });

            if (response.status !== 200) {
                alert("shit happens");
                throw new Error("Error while adding new persona");
            }
        } catch (err) {
            console.error("Błąd: ", err);
        }
    };

    return (
        <>
            <div className="menu-container">
                    {/* <Link to="/auth">
                        <button className="bg-blue-500 text-white p-2 rounded mt-2 mr-2">
                            Go to Auth Page
                        </button>
                    </Link> */}

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
                    
                    {isOpen && (
                        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
                            <div className="bg-white p-8 rounded shadow-lg relative">
                                <input
                                    value={personasName}
                                    onChange={(e) => setPersonasName(e.target.value)}
                                    type="text"
                                    className="form-control"
                                    id="persona_name_input"
                                    placeholder="Persona's name"
                                />
                                <textarea
                                    value={personasDesc}
                                    onChange={(e) => setPersonasDesc(e.target.value)}
                                    className="form-control"
                                    id="persona_description_textarea"
                                    rows="3"
                                    placeholder="Enter description"
                                ></textarea>
                                <button
                                    onClick={acceptPersona}
                                    className="mt-4 bg-red-500 text-white p-2 rounded"
                                >
                                    Save Persona
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default Menu;