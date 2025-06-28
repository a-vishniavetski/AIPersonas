describe('SC-002: Nawigacja do strony dodawania postaci (Add Persona)', () => {
  beforeEach(() => {
    // Krok 1: Otwórz stronę główną aplikacji z ustawionym tokenem
    cy.visit('https://localhost:5173', {
      onBeforeLoad(win) {
        // Krok 2: Ustaw token w localStorage
        win.localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxYTZkOTNjYS00Mjc4LTQ3YTktOTcxZS0xMmM0ODY4OTFiZWIiLCJhdWQiOlsiZmFzdGFwaS11c2VyczphdXRoIl0sImV4cCI6MTc1MTA0ODE4NX0.B55pJMBz1LXk86fiULazROSr1LN798QzLK9x1OIPSbE');
      },
    });
  });

  it('po zalogowaniu użytkownik może przejść do Add Persona', () => {
    // Krok 3: Sprawdź czy przycisk Add Persona jest widoczny
    cy.get('.menu-container', {timeout: 10000}).should('be.visible');
    cy.contains('Add Persona').should('be.visible');

    // Krok 4: Kliknij w przycisk Add Persona
    cy.contains('Add Persona').click();

    cy.contains('Create New Persona').should('be.visible');
  });
});
