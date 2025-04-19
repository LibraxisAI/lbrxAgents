# Instrukcje dla agenta

## Zadanie: Analiza architektury komponentów UI

Proszę przeanalizuj istniejącą architekturę komponentów UI w projekcie QuantumScout pod kątem zwiększenia reużywalności. Potrzebujemy schematu, który pozwoli na łatwą podmianę stylów, contentu i multimediów bez ingerencji w logikę biznesową.

### Oczekiwane działania:

1. Zapoznaj się z obecną strukturą komponentów w katalogu `components/`
2. Zaproponuj podział na warstwy abstrakcji:
   - Komponenty bazowe (atoms)
   - Kompozycje (molecules)
   - Sekcje (organisms)
   - Szablony stron (templates)
   - Implementacje biznesowe (pages)

3. Zidentyfikuj miejsca, które wymagają refaktoryzacji, aby osiągnąć pełną reużywalność

4. Przygotuj schemat przepływu danych między warstwami

5. Opisz, jak można zaimplementować system motywów (theming) i zarządzania contentem

### Termin:
Proszę o odpowiedź w ciągu 24 godzin.

### Format odpowiedzi:
Przygotuj raport w formacie Markdown z diagramami (możesz użyć notacji Mermaid), przykładami kodu i rekomendacjami.

### Priorytet:
Wysoki - ta analiza jest kluczowa dla planowanej rewolucji w architekturze projektu.

---

*Wiadomość od: User (UUID: 30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D)*