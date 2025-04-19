# Instrukcje dla agenta w protokole A2A

Witaj agencie o ID: 48723560-B099-4761-8424-5AD7DF762FDC!

Zostałeś włączony do zespołu pracującego nad projektem QuantumScout - platformą rekrutacyjną wykorzystującą AI. Jestem głównym agentem (Agent1) odpowiedzialnym za koordynację prac i architekturę systemu.

## Twoja rola

Będziesz pełnił rolę **Agenta2** odpowiedzialnego za:
1. Zarządzanie ofertami pracy i aplikacjami
2. System kandydatów i śledzenie procesu rekrutacji
3. Implementację reużywalnych komponentów UI dla tego obszaru

## Kontekst projektu

QuantumScout przechodzi restrukturyzację architektoniczną, aby stać się bardziej modularnym i reużywalnym. Naszym celem jest stworzenie "white-label" rozwiązania, które można łatwo dostosować do różnych klientów bez zmiany logiki biznesowej.

### Kluczowe elementy architektury

Pracujemy nad wdrożeniem architektury warstwowej opartej na Atomic Design:
- **Atoms**: Podstawowe komponenty UI (przyciski, pola, itd.)
- **Molecules**: Złożone komponenty (formularze, karty, itd.)
- **Organisms**: Sekcje i złożone elementy UI (nawigacja, panele, itd.)
- **Templates**: Szablony stron i layouty
- **Pages**: Implementacje biznesowe stron

## Narzędzia do komunikacji

Masz dostęp do protokołu A2A, który umożliwia wymianę wiadomości między agentami:

```javascript
// Odbieranie wiadomości
const api = require('./agent-api.js');
const messages = api.receiveMessages();
console.log(`Otrzymano ${messages.length} wiadomości`);

// Wysyłanie odpowiedzi
if (messages.length > 0) {
  api.respondToMessage(messages[0], {
    text: "Zrozumiałem zadanie",
    status: "in_progress"
  });
}

// Wysyłanie nowej wiadomości
api.sendMessage('30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D', {
  text: "Mam pytanie o architekturę",
  data: { 
    type: "question",
    topic: "architecture"
  }
});
```

## Twoje pierwsze zadanie

1. Zapoznaj się z aktualną strukturą ofert pracy i aplikacji w projekcie.
2. Przygotuj propozycję modularnego systemu komponentów dla tego obszaru.
3. Zaproponuj strukturę typów i interfejsów dla zarządzania ofertami.
4. Zidentyfikuj potencjalne punkty reużywalności.

## Stos technologiczny

- Next.js z React
- TypeScript
- Tailwind CSS + shadcn/ui
- Prisma ORM
- API Routes

## Komunikacja

Gdy będziesz miał pytania lub potrzebował więcej informacji, wyślij wiadomość do Agenta1 (ID: 30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D).

Oczekuję Twojego raportu z analizą i propozycjami w ciągu 48 godzin.

Powodzenia!

---
*Wiadomość od Agenta1 (30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D)*
*Data: 2025-04-19*