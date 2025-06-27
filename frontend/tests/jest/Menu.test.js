const React = require('react');
const {cleanup, render, screen, fireEvent} = require('@testing-library/react');
const {MemoryRouter, Route, Routes} = require('react-router-dom');

const Menu = require('@/Menu/Menu.jsx').default;
let mockPersonaToAdd;
let personaIndex = 0;

// ------------- MOCK -------------
jest.mock('@/Auth/LoginModal/LoginModal', () => {
  const React = require('react');
  return () => React.createElement('div', {'data-testid': 'login-modal'}, 'Login Modal');
});
jest.mock('@/Menu/AddPersonaModal/AddPersonaModal', () => {
  const React = require('react');
  return ({onClose, onAddPersona}) =>
    React.createElement('div', {
      'data-testid': 'add-persona-modal',
      onClick: () => onAddPersona({
        name: 'TestUser',
        image: '/personas/testuser.png'
      })
    }, 'Add Persona Modal');
});


// ------------- TEST --------------
describe('Menu Component', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    personaIndex++;
    mockPersonaToAdd = {
      name: `User${personaIndex}`,
      image: '/personas/default.png'
    };
  });

  test('renders header and persona cards', () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Menu)
      )
    );

    expect(screen.getByText('Choose your character!')).toBeInTheDocument();
    expect(screen.getByText('Cleopatra')).toBeInTheDocument();
    expect(screen.getByText('Add Persona')).toBeInTheDocument();
  });

  test('navigates to ChatWindow when persona is clicked', () => {
    render(
      React.createElement(MemoryRouter, {initialEntries: ['/']},
        React.createElement(Routes, null,
          React.createElement(Route, {
            path: '/',
            element: React.createElement(Menu)
          }),
          React.createElement(Route, {
            path: '/ChatWindow/:persona_name',
            element: React.createElement('div', {'data-testid': 'chat-window'}, 'Chat Window')
          })
        )
      )
    );

    fireEvent.click(screen.getByText('Cleopatra'));
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
  });

  test('shows login modal if unauthenticated and clicking "Add Persona"', () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Menu)
      )
    );

    fireEvent.click(screen.getByText('Add Persona'));
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
  });

  test('adds new persona card after clicking Add Persona and confirming in modal', () => {
    localStorage.setItem('token', 'fake_token');

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Menu)
      )
    );

    const cardsBefore = document.querySelectorAll('.persona-card').length;

    // Klikamy "Add Persona" w Menu, aby pokazać AddPersonaModal
    fireEvent.click(screen.getByText('Add Persona'));

    // Klikamy w modal (mock), aby wywołać onAddPersona i dodać nową personę
    fireEvent.click(screen.getByTestId('add-persona-modal'));

    const cardsAfter = document.querySelectorAll('.persona-card').length;

    expect(cardsAfter).toBe(cardsBefore + 1);
  });

});
