# Protokół A2A (Agent-to-Agent) - Dokumentacja

Ten dokument opisuje protokół komunikacji międzyagentowej A2A (Agent-to-Agent) używany w projekcie QuantumScout, oraz wprowadzone mechanizmy bezpieczeństwa.

## Wprowadzenie

Protokół A2A umożliwia komunikację między różnymi agentami AI pracującymi nad projektem. Pozwala na:
- Wymianę wiadomości
- Wykrywanie innych agentów 
- Publikowanie własnych możliwości
- Reagowanie na wiadomości kontrolne
- Bezpieczne zakończenie pracy agenta

## Konfiguracja środowiska

Ścieżki do katalogów komunikacyjnych:
```javascript
BASE_PATH = '/tmp/quantum-scout/agents';
MESSAGES_PATH = path.join(BASE_PATH, 'messages');
DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
```

## Bezpieczeństwo protokołu

### Mechanizm zakończenia pracy

Protokół zawiera mechanizmy bezpiecznego zakończenia pracy agenta:

1. **Obsługa sygnałów systemowych**:
   - `SIGINT` (Ctrl+C)
   - `SIGTERM`
   - `SIGHUP`
   - Nieobsłużone wyjątki

2. **Wiadomości kontrolne**:
   - Typ wiadomości: `control` lub `emergency`
   - Zawartość: `control_command: 'exit_loop'` lub `control_command: 'force_exit'`
   - Można również używać `emergency: true`

3. **Funkcje zarządzania cyklem życia**:
   - `enableShutdownHandlers()` - włącza obsługę sygnałów
   - `onShutdown(fn)` - rejestruje funkcję do wywołania przy zamykaniu
   - `isShutdownRequested()` - sprawdza czy zażądano zamknięcia
   - `requestShutdown()` - żąda zakończenia pracy agenta

### Przykładowa pętla główna z obsługą zamknięcia

```javascript
// Włączenie obsługi zakończenia procesu
agentApi.enableShutdownHandlers();

// Zarejestruj handler wyłączenia agenta
agentApi.onShutdown(() => {
  console.log(`Agent kończy działanie`);
  return Promise.resolve();
});

// Pętla sprawdzania wiadomości
while (!agentApi.isShutdownRequested()) {
  try {
    // Pobierz nowe wiadomości (które mogą zawierać wiadomości kontrolne)
    const messages = agentApi.receiveMessages();
    
    // Przetwarzanie wiadomości
    // ...
    
    // Czekaj przed kolejnym sprawdzeniem
    await new Promise(resolve => setTimeout(resolve, 3000));
  } catch (error) {
    console.error(`Błąd w głównej pętli: ${error.message}`);
  }
}

console.log("Pętla agenta zakończona");
```

## Typy wiadomości

Protokół definiuje następujące typy wiadomości:

| Typ | Opis | Przykład użycia |
|-----|------|----------------|
| `query` | Zapytanie wymagające odpowiedzi | Pytanie o status prac |
| `response` | Odpowiedź na zapytanie | Informacja o ukończonym zadaniu |
| `notification` | Powiadomienie niewymagające odpowiedzi | Ogłoszenie dołączenia do projektu |
| `action` | Żądanie wykonania akcji | Prośba o analizę kodu |
| `control` | Wiadomość kontrolna | Polecenie zakończenia działania |
| `emergency` | Wiadomość awaryjna | Natychmiastowe zakończenie działania |

## Format wiadomości

```javascript
{
  message_id: "unikalne-id-wiadomości",
  sender_id: "id-nadawcy",
  sender_name: "nazwa-nadawcy",
  target_id: "id-odbiorcy",
  timestamp: "2025-04-19T17:30:00Z",
  message_type: "typ-wiadomości",
  content: {
    // Zawartość wiadomości zależna od typu
    text: "Treść wiadomości",
    data: { /* dowolne dane */ },
    control_command: "exit_loop" // tylko dla wiadomości kontrolnych
  },
  capabilities_required: ["lista", "wymaganych", "zdolności"]
}
```

## API agenta

### Podstawowe funkcje

| Funkcja | Opis |
|---------|------|
| `sendMessage(targetAgentId, messageContent, messageType)` | Wysyła wiadomość do innego agenta |
| `receiveMessages(markAsRead)` | Odbiera wiadomości przeznaczone dla tego agenta |
| `publishCapabilities()` | Publikuje możliwości agenta do katalogu discovery |
| `discoverAgents()` | Wykrywa innych agentów w systemie |
| `respondToMessage(originalMessage, responseContent)` | Odpowiada na wiadomość |

### Funkcje zarządzania cyklem życia

| Funkcja | Opis |
|---------|------|
| `enableShutdownHandlers()` | Włącza obsługę sygnałów zamykania procesu |
| `onShutdown(fn)` | Rejestruje funkcję do wykonania przy zamykaniu |
| `isShutdownRequested()` | Sprawdza czy zażądano zamknięcia |
| `requestShutdown()` | Żąda zakończenia pracy agenta |

## Dobre praktyki

1. **Zawsze włączaj obsługę zamykania procesu**:
   ```javascript
   agentApi.enableShutdownHandlers();
   ```

2. **Używaj warunku wyjścia z pętli**:
   ```javascript
   while (!agentApi.isShutdownRequested()) {
     // Kod pętli
   }
   ```

3. **Rejestruj funkcje czyszczące**:
   ```javascript
   agentApi.onShutdown(() => {
     // Kod sprzątający
     return Promise.resolve();
   });
   ```

4. **Obsługuj wiadomości kontrolne**:
   ```javascript
   if (message.message_type === 'control') {
     console.log("Otrzymano wiadomość kontrolną");
     if (message.content && message.content.control_command === 'exit_loop') {
       agentApi.requestShutdown();
     }
   }
   ```

5. **Reaguj na prośby o zakończenie**:
   ```javascript
   if (agentApi.isShutdownRequested()) {
     console.log("Otrzymano żądanie zakończenia, sprzątam...");
     // Kod sprzątający
     break; // lub return z funkcji
   }
   ```

## Rozwiązywanie problemów

| Problem | Rozwiązanie |
|---------|-------------|
| Agent nie reaguje na SIGINT (Ctrl+C) | Upewnij się, że wywołano `enableShutdownHandlers()` |
| Agent nie wykrywa wiadomości kontrolnych | Sprawdź implementację `receiveMessages()` w najnowszej wersji |
| Agent nie wychodzi z pętli | Upewnij się, że warunek pętli zawiera `!agentApi.isShutdownRequested()` |

## Przyszłe rozszerzenia

Planowane rozszerzenia protokołu:
- Potwierdzenia dostarczenia wiadomości
- Mechanizm retransmisji dla utraconych wiadomości
- Kompresja dla dużych wiadomości
- Szyfrowanie wiadomości dla zwiększenia bezpieczeństwa

## Aktualizacje protokołu

### Wersja 1.1.0 (2025-04-19)
- Dodano obsługę sygnałów systemowych (SIGINT, SIGTERM)
- Dodano mechanizm wykrywania wiadomości kontrolnych
- Dodano funkcje do bezpiecznego zamykania agenta
- Naprawiono ścieżki katalogów