describe('Menu-Persona flow - system tests', () => {
  beforeEach(() => {
    cy.visit('https://localhost:5173');
    cy.clearLocalStorage();
  });

  it('shows list of personas and allows navigation to ChatWindow', () => {
    cy.contains('Choose your character!');

    cy.get('.persona-card').should('have.length.greaterThan', 1);

    cy.contains('Cleopatra').click({ force: true });

    cy.url().should('include', '/ChatWindow/Cleopatra');
    cy.contains('Cleopatra'); // np. nagłówek w oknie czatu
  });

  it('navigates to AddPersona page when authenticated', () => {
    cy.window().then((win) => {
      win.localStorage.setItem('token', 'fake_token');
    })
    cy.reload();

    cy.contains('Add Persona').click();
    cy.url().should('include', '/AddPersona');
  });
});
