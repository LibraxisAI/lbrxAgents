# Protokół komunikacji międzyagentowej A2A

## Wprowadzenie

Ten protokół umożliwia współpracę wielu autonomicznych agentów AI (Claude, GPT, itp.) w ramach jednego projektu. Główne cechy:

- Dynamiczne ogłaszanie i konfiguracja agentów
- Automatyczne wykrywanie innych agentów
- Mechanizm statusu aktywności agentów
- Koordynacja przez agenta-orkiestratora
- Bezpieczne zakończenie pracy agentów

## Szybki start

### Uruchomienie agenta

1. Skopiuj plik `agent-template.js` i dostosuj go do swoich potrzeb:
   ```bash
   cp agent-template.js my-agent.js
   ```

2. Edytuj w pliku `my-agent.js` następujące elementy:
   - `AGENT_NAME` - nazwa twojego agenta
   - `AGENT_DESCRIPTION` - opis roli agenta w projekcie
   - `AGENT_CAPABILITIES` - lista umiejętności agenta

3. Zaimplementuj logikę obsługi wiadomości w funkcji `handleMessage`

4. Uruchom agenta:
   ```bash
   node my-agent.js
   ```

### Uruchomienie orkiestratora

1. Skopiuj plik `OrchestratorTemplate.js`:
   ```bash
   cp OrchestratorTemplate.js my-orchestrator.js
   ```

2. Edytuj opis projektu i inne parametry

3. Uruchom orkiestratora:
   ```bash
   node my-orchestrator.js
   ```

## Struktura protokołu

### Typy wiadomości

- `query` - zapytania wymagające odpowiedzi
- `response` - odpowiedzi na zapytania
- `notification` - powiadomienia niewymagające odpowiedzi
- `announcement` - ogłoszenia o dołączeniu/zmianie agenta
- `action` - żądania wykonania akcji
- `control` - wiadomości kontrolne (np. zakończenie pracy)
- `status_update` - aktualizacje statusu agenta/zadania
- `task_request` - prośby o przydzielenie zadań
- `task_completion` - informacje o zakończeniu zadań

### Format wiadomości

```javascript
{
  message_id: "unikalne-id",
  sender_id: "id-nadawcy",
  sender_name: "nazwa-nadawcy",
  target_id: "id-odbiorcy",
  timestamp: "2025-04-19T12:00:00Z",
  message_type: "typ-wiadomości",
  content: {
    // Zawartość zależna od typu wiadomości
    text: "Treść wiadomości",
    // Inne pola specyficzne dla typu
  },
  capabilities_required: []
}
```

## Korzystanie z API agenta

### Podstawowe funkcje komunikacyjne

```javascript
// Wysyłanie wiadomości
agentApi.sendMessage('id-odbiorcy', {text: 'Witaj!'}, 'query');

// Odbieranie wiadomości
const messages = agentApi.receiveMessages();

// Odpowiadanie na wiadomość
agentApi.respondToMessage(originalMessage, {text: 'Odpowiedź'});
```

### Zarządzanie agentami

```javascript
// Publikacja możliwości i ogłoszenie obecności
agentApi.publishCapabilities();

// Odkrywanie innych agentów
const agents = agentApi.discoverAgents();
// lub tylko aktywnych
const activeAgents = agentApi.discoverAgents({onlyActive: true});

// Sprawdzenie czy agent jest aktywny
const isActive = agentApi.isAgentActive('id-agenta');

// Aktualizacja statusu aktywności
agentApi.pingAgent();

// Wyrejestrowanie agenta
agentApi.deregisterAgent();
```

### Interakcja z orkiestratorem

```javascript
// Pobranie informacji o orkiestratorze
const orchestrator = agentApi.getOrchestratorInfo();

// Pobranie statusu orkiestratora
const status = agentApi.getOrchestratorStatus();

// Sprawdzenie instrukcji orkiestratora
agentApi.checkOrchestratorInstructions();
```

### Zarządzanie procesem

```javascript
// Włączenie obsługi zakończenia procesu
agentApi.enableShutdownHandlers();

// Zarejestrowanie funkcji do wywołania przy zamknięciu
agentApi.onShutdown(() => {
  console.log('Sprzątanie przed zamknięciem...');
  return Promise.resolve();
});

// Sprawdzenie czy zażądano zamknięcia
if (agentApi.isShutdownRequested()) {
  // Zakończ działanie
}

// Zażądanie zamknięcia
agentApi.requestShutdown();
```

## Struktura katalogów

Protokół automatycznie tworzy i korzysta z następującej struktury katalogów:

```
<root-projektu>/lbrxAgents/.a2a/
  ├── discovery/            # Karty agentów do wykrywania
  ├── messages/             # Wymiana wiadomości
  │   └── read/             # Przeczytane wiadomości
  ├── orchestrator/         # Pliki orkiestratora
  │   ├── global_instructions.json
  │   ├── status.json
  │   └── <agent-id>_instructions.json
  └── status/               # Status agentów
      └── agents_status.json
```

## Dobre praktyki

1. **Dynamiczne ogłaszanie** - każdy agent powinien ogłosić swoją obecność w systemie przy starcie
2. **Monitorowanie statusu** - regularnie aktualizuj swój status aktywności
3. **Eleganckie kończenie pracy** - używaj mechanizmów deregistracji przed zakończeniem
4. **Obsługa komunikatów kontrolnych** - reaguj na komunikaty kontrolne i zakończ pracę gdy trzeba
5. **Współpraca z orkiestratorem** - korzystaj z instrukcji orkiestratora do koordynacji pracy

## Najczęstsze problemy

- **Agent nie widzi innych agentów** - sprawdź ścieżki do katalogów discovery i messages
- **Wiadomości nie są dostarczane** - sprawdź UUID odbiorcy i upewnij się, że jest aktywny
- **Agent nie kończy pracy poprawnie** - upewnij się, że używasz agentApi.requestShutdown()
- **Instrukcje orkiestratora nie są dostępne** - sprawdź czy orkiestrator jest uruchomiony

## Scenariusze użycia

### Prośba o informacje

```javascript
// Agent 1 wysyła zapytanie
agentApi.sendMessage('id-agenta-2', {
  text: 'Potrzebuję status realizacji zadania X',
  task_id: 'zadanie-X'
}, 'query');

// Agent 2 odpowiada
agentApi.respondToMessage(message, {
  text: 'Status zadania X',
  task_id: 'zadanie-X',
  status: 'in_progress',
  completion: 75
});
```

### Ogłoszenie dołączenia do projektu

```javascript
// Agent ogłasza swoją obecność
agentApi.publishCapabilities();
// (publishCapabilities automatycznie wysyła wiadomości do orkiestratora i innych agentów)
```

### Aktualizacja statusu zadania

```javascript
// Agent informuje o postępie
agentApi.sendMessage('id-orkiestratora', {
  text: 'Aktualizacja statusu zadania X',
  task_id: 'zadanie-X',
  status: 'in_progress',
  completion: 75,
  issues: ['problem-A', 'problem-B']
}, 'status_update');
```