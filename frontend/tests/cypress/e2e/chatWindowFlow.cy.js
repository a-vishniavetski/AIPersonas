describe('SC-001: Przeglądanie postaci i przejście do okna czatu', () => {
  const personaName = 'Cleopatra';

  beforeEach(() => {
    // Brak tokenu = niezalogowany użytkownik
    cy.visit('https://localhost:5173', {
      onBeforeLoad(win) {
        win.localStorage.clear();
      }
    });
  });

  it('wyświetla dostępne postaci i przechodzi do widoku czatu po kliknięciu Cleopatra', () => {
    // Sprawdź nagłówek
    cy.contains('Choose your character!').should('be.visible');

    // Sprawdź, że jest więcej niż jedna karta postaci
    cy.get('[role="button"]') // lub inny selektor pasujący do kart postaci
      .should('have.length.greaterThan', 1);

    // Kliknij kartę "Cleopatra"
    cy.contains('Cleopatra').click();

    // Sprawdź przekierowanie do odpowiedniego URL
    cy.url().should('include', `/ChatWindow/${personaName}`);

    // Sprawdź, czy "Cleopatra" pojawia się w widoku czatu
    cy.get('.persona-title').should('contain', personaName);
  });
});
