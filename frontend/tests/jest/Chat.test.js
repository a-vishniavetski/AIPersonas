const React = require('react');
const {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  act
} = require('@testing-library/react');
const {MemoryRouter, Route, Routes} = require('react-router-dom');

const ChatWindow = require('@/Chat/ChatWindow').default;

jest.mock('@/Chat/ChatWindowsApi', () => ({
  downloadPDFConversation: jest.fn(() => Promise.resolve()),
  useAuthenticatedFetch: jest.fn(() => () =>
    Promise.resolve({
      json: () => Promise.resolve({
        persona_id: 'p1',
        user_id: 'u1',
        conversation_id: 'test-conv-id'
      }),
    })
  ),
}));

const {
  downloadPDFConversation,
  useAuthenticatedFetch
} = require('@/Chat/ChatWindowsApi');

global.fetch = jest.fn();
window.alert = jest.fn();
HTMLElement.prototype.scrollIntoView = jest.fn();

class MockMediaRecorder {
  constructor() {
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    if (this.onstop) this.onstop();
  }
}

Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: jest.fn(() => Promise.resolve('mock-stream')),
  },
  writable: true,
});
global.MediaRecorder = MockMediaRecorder;

describe('ChatWindow Component - Testy TC-005 do TC-010', () => {
  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');

    global.fetch = jest.fn((url, options) => {
      if (url === 'https://localhost:8000/api/chat_history') {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{
            text: 'History message',
            sender: 'bot'
          }])
        });
      }
      // Można dodać inne endpointy fetch jeśli trzeba
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({})
      });
    });
  });

  function renderWithRouter(persona_name = 'Cleopatra') {
    return render(
      React.createElement(MemoryRouter, {initialEntries: [`/chat/${persona_name}`]},
        React.createElement(Routes, null,
          React.createElement(Route, {
            path: "/chat/:persona_name",
            element: React.createElement(ChatWindow)
          })
        )
      )
    );
  }

  test('TC-005: renders all UI elements correctly', async () => {
    renderWithRouter('Cleopatra');

    await waitFor(() => {
      const elems = screen.getAllByText(/Description/i);
      expect(elems[0]).toBeInTheDocument();
    });

    expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: '↑'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Export to PDF/i})).toBeInTheDocument();

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Cleopatra');
    expect(img).toHaveAttribute('src', 'https://localhost:8000/static/personas/cleopatra.png');
  });

  test('TC-006: loads chat history and displays messages', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [{text: 'Hello from history', sender: 'bot'}],
    });

    renderWithRouter();

    await waitFor(() => screen.getByText('Hello from history'));

    expect(screen.getByText('Hello from history')).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      'https://localhost:8000/api/chat_history',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({'Authorization': 'Bearer mock-token'}),
      })
    );
  });

  test('TC-007: sending user message adds message and triggers bot response', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      }) // fetch chat_history
      .mockResolvedValueOnce({
        ok: true,
        json: async () => 'Bot answer',
      }); // fetch get_answer

    renderWithRouter();

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByRole('button', {name: '↑'});

    fireEvent.change(input, {target: {value: 'Hello bot'}});
    fireEvent.click(sendButton);

    expect(screen.getByText('Hello bot')).toBeInTheDocument();

    await waitFor(() => screen.getByText('Bot answer'));
    expect(screen.getByText('Bot answer')).toBeInTheDocument();
    expect(input.value).toBe('');
  });

  test('TC-008: toggleRecording starts/stops recording and updates input after transcription', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [{text: 'dummy', sender: 'bot'}],
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({text: 'Transcribed text'}),
      });

    renderWithRouter();

    const micButton = screen.getByRole('button', {name: /🎙️/i});

    await act(async () => {
      fireEvent.click(micButton); // start recording
    });
    expect(micButton.className).toMatch(/recording/);

    await act(async () => {
      fireEvent.click(micButton); // stop recording triggers transcription
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type a message/i).value).toBe('Transcribed text');
    });
  });

  test('TC-009: scrollIntoView is called on new message', async () => {
    renderWithRouter();

    const input = screen.getByPlaceholderText(/Type a message/i);
    const sendButton = screen.getByRole('button', {name: '↑'});

    fireEvent.change(input, {target: {value: 'Scroll test'}});
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(HTMLElement.prototype.scrollIntoView).toHaveBeenCalled();
    });
  });
});
