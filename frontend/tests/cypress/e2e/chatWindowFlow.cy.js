describe('ChatWindow - system tests', () => {
  const personaName = 'Cleopatra';

  beforeEach(() => {
    cy.intercept('POST', 'https://localhost:8000/api/add_persona', {
      statusCode: 200,
      body: { persona_id: 1, user_id: 1, conversation_id: 123 }
    }).as('addPersona');

    cy.intercept('POST', 'https://localhost:8000/api/chat_history', {
      statusCode: 200,
      body: [
        { text: 'Hello', sender: 'bot' },
        { text: 'Hi', sender: 'user' }
      ]
    }).as('chatHistory');

    cy.intercept('POST', 'https://localhost:8000/api/get_answer', (req) => {
      req.reply({
        statusCode: 200,
        body: 'This is a mocked bot reply'
      });
    }).as('getAnswer');

    cy.intercept('POST', '/text_to_speech', (req) => {
      req.reply({
        statusCode: 200,
        headers: { 'content-type': 'audio/mpeg' },
        body: new ArrayBuffer(8)
      });
    }).as('textToSpeech');

    cy.visit(`https://localhost:5173/ChatWindow/${personaName}`, {
      onBeforeLoad(win) {
        win.localStorage.setItem('token', 'fake_token');
      }
    });
  });

  it('loads persona and chat history', () => {
    cy.wait('@addPersona');
    cy.wait('@chatHistory');

    cy.get('.persona-title').should('contain', personaName);
    cy.get('.bot-message').should('contain', 'Hello');
    cy.get('.user-message').should('contain', 'Hi');
  });

  it('sends a message and receives bot reply', () => {
    const userMessage = 'How are you?';

    cy.get('input[type="text"]').type(userMessage);
    cy.get('form').submit();

    // User message should appear immediately
    cy.get('.user-message').last().should('contain', userMessage);

    // Wait for bot reply API and check bot message
    cy.wait('@getAnswer');
    cy.get('.bot-message').last().should('contain', 'This is a mocked bot reply');
  });

  it('plays audio when clicking voice button on bot message', () => {
    cy.wait('@chatHistory');

    cy.get('.bot-message').first().within(() => {
      cy.get('button#voiceOver_button').click();
    });

    cy.wait('@textToSpeech');
    // No easy way to assert audio play, but at least check request
  });

  it('toggles recording button state', () => {
    // Cannot test MediaRecorder in Cypress directly, but can test button state toggle

    cy.get('button.mic-button').as('micButton');

    cy.get('@micButton').click();

    cy.get('@micButton').should('have.class', 'recording');

    cy.get('@micButton').click();

    cy.get('@micButton').should('not.have.class', 'recording');
  });

  it('exports conversation to PDF triggers alert on error', () => {
    // Spy on window alert
    cy.on('window:alert', (txt) => {
      expect(txt).to.contain("Can't download PDF");
    });

    cy.get('button').contains('Export to PDF').click();
  });


});
