const React = require('react');
const {cleanup, render, screen, fireEvent, waitFor, act} = require('@testing-library/react');
const {MemoryRouter, Route, Routes} = require('react-router-dom');

const ChatWindow = require('@/Chat/ChatWindow').default;

// --- MOCK ---
// Mock ChatWindowsApi module
jest.mock('@/Chat/ChatWindowsApi', () => {
  return {
    downloadPDFConversation: jest.fn(() => Promise.resolve()),
    useAuthenticatedFetch: () => jest.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ persona_id: 'p1', user_id: 'u1', conversation_id: 'c1' }),
      })
    ),
  };
});

// Global fetch mock
global.fetch = jest.fn();

// Mock alert
window.alert = jest.fn();

// Mock scrollIntoView
HTMLElement.prototype.scrollIntoView = jest.fn();

// Mock MediaRecorder and mediaDevices
class MockMediaRecorder {
  constructor() {
    this.state = 'inactive';
    this.ondataavailable = null;
    this.onstop = null;
  }
  start() { this.state = 'recording'; }
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

// --- TESTS ---
describe('ChatWindow Component', () => {
  beforeEach(() => {
    cleanup();
    jest.clearAllMocks();
    localStorage.setItem('token', 'mock-token');
  });

  function renderWithRouter(persona_name = 'Cleopatra') {
    return render(
      React.createElement(MemoryRouter, {initialEntries: [`/chat/${persona_name}`]},
        React.createElement(Routes, null,
          React.createElement(Route, {path: "/chat/:persona_name", element: React.createElement(ChatWindow)})
        )
      )
    );
  }

  test('renders UI elements', async () => {
    renderWithRouter();

    expect(screen.getByText(/Description/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type a message/i)).toBeInTheDocument();
    expect(screen.getByRole('button', {name: '↑'})).toBeInTheDocument();
    expect(screen.getByRole('button', {name: /Export to PDF/i})).toBeInTheDocument();

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('alt', 'Cleopatra');
    expect(img).toHaveAttribute('src', '/personas/cleopatra.png');
  });

  test('loads chat history and shows messages', async () => {
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

  test('sending a user message adds message and triggers bot response', async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      }) // chat_history
      .mockResolvedValueOnce({
        ok: true,
        json: async () => 'Bot answer',
      }); // get_answer

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

  test('toggleRecording starts and stops recording and updates input after transcription', async () => {
  global.fetch
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ messages: [] }), // ← poprawna struktura historii czatu
      text: async () => '[]',
    })

    // Mock do transkrypcji (drugi fetch)
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({ text: 'Transcribed text' }),
    });

    renderWithRouter();

    const micButton = screen.getByRole('button', {name: /🎙️/i});

    await act(async () => {
      fireEvent.click(micButton); // start recording
    });
    expect(micButton.className).toMatch(/recording/);

    await act(async () => {
      fireEvent.click(micButton); // stop recording
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type a message/i).value).toBe('Transcribed text');
    });
  });

  test('handleExportToPdf calls downloadPDFConversation or alerts on error', async () => {
    const {downloadPDFConversation} = require('@/Chat/ChatWindowsApi');
    downloadPDFConversation.mockImplementationOnce(() => Promise.reject('fail'));

    renderWithRouter();

    const exportButton = screen.getByRole('button', {name: /Export to PDF/i});

    // First without conversationId triggers alert
    await act(async () => {
      fireEvent.click(exportButton);
    });
    expect(window.alert).toHaveBeenCalledWith("Can't download PDF right now. Please try again later.");
  });

  test('scrollIntoView is called on new message', async () => {
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
