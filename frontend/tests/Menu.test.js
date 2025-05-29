const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const { MemoryRouter, Route, Routes } = require('react-router-dom');

const Menu = require('@/Menu/Menu.jsx').default;

// ------------- MOCK -------------
jest.mock('@/Auth/LoginModal/LoginModal', () => {
  const React = require('react');
  return () => React.createElement('div', { 'data-testid': 'login-modal' }, 'Login Modal');
});

// ------------- TEST --------------
describe('Menu Component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('renders header and persona cards', () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Menu, null)
      )
    );

    expect(screen.getByText('Choose your character!')).toBeInTheDocument();
    expect(screen.getByText('Cleopatra')).toBeInTheDocument();
    expect(screen.getByText('Add Persona')).toBeInTheDocument();
  });

  test('navigates to ChatWindow when persona is clicked', () => {
    render(
      React.createElement(MemoryRouter, { initialEntries: ['/'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/', element: React.createElement(Menu) }),
          React.createElement(Route, { path: '/ChatWindow/:persona_name', element: React.createElement('div', { 'data-testid': 'chat-window' }, 'Chat Window') })
        )
      )
    );

    fireEvent.click(screen.getByText('Cleopatra'));
    expect(screen.getByTestId('chat-window')).toBeInTheDocument();
  });

  test('shows login modal if unauthenticated and clicking "Add Persona"', () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Menu, null)
      )
    );

    fireEvent.click(screen.getByText('Add Persona'));
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
  });

  test('navigates to /AddPersona if authenticated and clicking "Add Persona"', () => {
    localStorage.setItem('token', 'fake_token');

    render(
      React.createElement(MemoryRouter, { initialEntries: ['/'] },
        React.createElement(Routes, null,
          React.createElement(Route, { path: '/', element: React.createElement(Menu) }),
          React.createElement(Route, { path: '/AddPersona', element: React.createElement('div', { 'data-testid': 'add-persona-page' }, 'Add Persona Page') })
        )
      )
    );

    fireEvent.click(screen.getByText('Add Persona'));
    expect(screen.getByTestId('add-persona-page')).toBeInTheDocument();
  });
});
