# Plan testów front-end – Aplikacja Webowa

## 1. Zakres testów

Testowaniu podlegają:
- Komponenty UI (formularze, przyciski, nawigacja),
- Responsywność (desktop, tablet, mobile),
- Walidacja danych wejściowych,
- Integracja z API,
- Spójność graficzna z designem,
- Testy E2E – pełna ścieżka użytkownika.

## 2. Cele testowania

- Zapewnienie zgodności interfejsu z wymaganiami,
- Identyfikacja defektów UX/UI,
- Sprawdzenie dostępności,
- Walidacja poprawności integracji front-end z backendem.

## 3. Strategia testowania

### Poziomy testowania
- Testy jednostkowe (komponenty),
- Testy integracyjne (komponenty i logika),
- Testy systemowe i akceptacyjne (cała aplikacja).

### Rodzaje testów
- Testy manualne (UI, eksploracyjne),
- Testy automatyczne (E2E – Cypress, Playwright),
- Testy funkcjonalne i niefunkcjonalne (np. responsywność, dostępność).

### Techniki projektowania testów
- Na podstawie przypadków użycia,
- Testy graniczne i wartości skrajnych,
- Exploratory testing.

## 4. Harmonogram

| Etap | Zakres | Termin | Odpowiedzialny |
|------|--------|--------|----------------|
| Analiza wymagań | Identyfikacja funkcji do testowania | DD.MM.RRRR | QA Lead |
| Tworzenie przypadków testowych | Test cases i scenariusze | DD.MM.RRRR | QA Team |
| Testy manualne | UI testy głównych funkcji | DD.MM.RRRR | Tester manualny |
| Testy E2E | Automatyzacja i uruchomienie | DD.MM.RRRR | QA Automation |
| Raport końcowy | Podsumowanie wyników | DD.MM.RRRR | QA Lead |

## 5. Zespół testujący

- QA Lead: Imię Nazwisko
- Tester manualny: Imię Nazwisko
- QA Automation: Imię Nazwisko
- Front-end developerzy: wsparcie przy debugowaniu

## 6. Środowisko testowe

- Przeglądarki: Chrome, Firefox, Safari
- Urządzenia: Desktop, tablet, mobile
- Systemy: Windows, macOS, iOS, Android
- Narzędzia: Jest, Testing Library, Cypress, Storybook, axe-core

## 7. Procedury obsługi błędów

- Zgłaszanie błędów w JIRA,
- Dokumentacja: zrzuty ekranu, logi z konsoli,
- Priorytetyzacja (P0 – krytyczny, P1 – wysoki, ...),
- Śledzenie i regresja po poprawkach.

## 8. Raportowanie i metryki

- Codzienne raporty testowe,
- Metryki:
  - Liczba przetestowanych przypadków,
  - Liczba znalezionych błędów,
  - Czas reakcji na defekt,
  - Pokrycie testami.

## 9. Scenariusze i przypadki testowe

### Scenariusz: Logowanie do systemu

**Przypadki testowe:**
1. Pole e-mail przyjmuje poprawny adres.
2. Pole hasło ukrywa znaki.
3. Przycisk „Zaloguj” działa tylko przy wypełnionym formularzu.
4. Po logowaniu przekierowanie do dashboardu.

**Oczekiwany rezultat:** Użytkownik zostaje zalogowany i trafia na stronę główną.

---

