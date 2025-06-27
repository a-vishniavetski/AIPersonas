const React = require('react');
const {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor
} = require('@testing-library/react');
const {MemoryRouter, Route, Routes} = require('react-router-dom');

const Menu = require('@/Menu/Menu.jsx').default;

// Mock modals
jest.mock('@/Auth/LoginModal/LoginModal', () => {
  const React = require('react');
  return ({isOpen}) => (isOpen ? React.createElement('div', {'data-testid': 'login-modal'}, 'Login Modal') : null);
});
jest.mock('@/Menu/AddPersonaModal/AddPersonaModal', () => {
  const React = require('react');
  return ({onAddPersona}) =>
    React.createElement(
      'div',
      {
        'data-testid': 'add-persona-modal',
        onClick: () =>
          onAddPersona({
            name: 'TestUser',
            image: '/personas/testuser.png',
          }),
      },
      'Add Persona Modal'
    );
});

describe('Menu Component', () => {
  beforeEach(() => {
    localStorage.clear();
    cleanup();
    // Mock global fetch to avoid real network calls during useEffect
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({persona_names: []}),
      })
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('TC-001: renders header, Cleopatra persona, and Add Persona button', async () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Menu)
      )
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    expect(screen.getByText('Choose your character!')).toBeInTheDocument();
    expect(screen.getByText('Add Persona')).toBeInTheDocument();
  });

  test('TC-002: navigates to ChatWindow when a persona is clicked', async () => {
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

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Cleopatra'));
    expect(await screen.findByTestId('chat-window')).toBeInTheDocument();
  });

  test('TC-003: shows login modal when unauthenticated user clicks Add Persona', async () => {
    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Menu)
      )
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    fireEvent.click(screen.getByText('Add Persona'));
    expect(screen.getByTestId('login-modal')).toBeInTheDocument();
  });

  test('TC-004: adds new persona card after adding persona as authenticated user', async () => {
    localStorage.setItem('token', 'fake_token');

    render(
      React.createElement(MemoryRouter, null,
        React.createElement(Menu)
      )
    );

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    // Liczymy karty postaci przed dodaniem
    const cardsBefore = screen.getAllByRole('button').filter(
      el => el.classList.contains('persona-card') && el.textContent !== 'Add Persona'
    ).length;

    fireEvent.click(screen.getByText('Add Persona'));
    fireEvent.click(screen.getByTestId('add-persona-modal'));

    // Po dodaniu karty powinno być więcej o 1
    const cardsAfter = screen.getAllByRole('button').filter(
      el => el.classList.contains('persona-card') && el.textContent !== 'Add Persona'
    ).length;

    expect(cardsAfter).toBe(cardsBefore + 1);
  });
});
