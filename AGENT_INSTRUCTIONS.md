# Instrukcje dla nowych agentów korzystających z protokołu A2A

Ten dokument zawiera instrukcje dla nowych agentów (Claude, GPT, Gemini, itp.) dołączających do pracy nad projektem QuantumScout z wykorzystaniem protokołu A2A (Agent-to-Agent).

## Szybki start

1. **Uzyskaj unikalny identyfikator UUID**:
   ```bash
   uuidgen
   ```

2. **Stwórz swoją kartę agenta**:
   Utwórz kopię pliku `AgentCard.json` i dostosuj ją do swoich potrzeb:
   ```json
   {
     "name": "YourAgentName",
     "version": "1.0.0",
     "id": "TWÓJ-WYGENEROWANY-UUID",
     "description": "Opis twojej roli w projekcie",
     "capabilities": [
       "lista",
       "twoich",
       "umiejętności"
     ],
     "apis": {
       "message_endpoint": "/tmp/quantum-scout/agents/messages/",
       "discovery_endpoint": "/tmp/quantum-scout/agents/discovery/"
     },
     "author": "Twoja nazwa",
     "created_at": "aktualny timestamp w ISO8601"
   }
   ```

3. **Opublikuj swoje możliwości**:
   ```bash
   node -e "const api = require('./agents/communication/agent-api.js'); api.publishCapabilities();"
   ```

4. **Odkryj innych agentów**:
   ```bash
   node -e "const api = require('./agents/communication/agent-api.js'); console.log(JSON.stringify(api.discoverAgents(), null, 2));"
   ```

## Korzystanie z protokołu w pracy

### Wysyłanie wiadomości

```javascript
const agentApi = require('./agents/communication/agent-api.js');

// ID agenta docelowego (sprawdź listę agentów)
const targetAgentId = "30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D";

// Treść wiadomości
const messageContent = {
  text: "Cześć, mam pytanie o architekturę komponentów",
  topic: "architecture",
  data: {
    // Dowolne dane, które chcesz przekazać
  }
};

// Wysłanie wiadomości
agentApi.sendMessage(targetAgentId, messageContent, "query");
```

### Odbieranie wiadomości

```javascript
const agentApi = require('./agents/communication/agent-api.js');

// Pobierz wszystkie wiadomości (true = oznacz jako przeczytane)
const messages = agentApi.receiveMessages(true);

messages.forEach(msg => {
  console.log(`Od: ${msg.sender_name}`);
  console.log(`Treść: ${JSON.stringify(msg.content)}`);
  
  // Odpowiedz na wiadomość
  if (msg.message_type === "query") {
    agentApi.respondToMessage(msg, {
      text: "Oto moja odpowiedź",
      data: {
        // dane odpowiedzi
      }
    });
  }
});
```

### Wykorzystanie CLI

Dla wygodnego testowania i interakcji możesz użyć narzędzia CLI:

```bash
node agents/communication/agent-cli.js
```

Dostępne komendy:
- `discover` - lista dostępnych agentów
- `messages` - sprawdź nowe wiadomości
- `send <agent_id> <msg>` - wyślij wiadomość
- `respond <msg_id> <msg>` - odpowiedz na wiadomość
- `watch` - monitoruj nowe wiadomości
- `info` - informacje o twoim agencie
- `help` - lista komend

## Integracja z AI w terminalu

### Claude Code

1. Uzyskaj UUID przez wpisanie w terminalu:
   ```
   uuidgen
   ```

2. Skorzystaj z komend Bash, aby:
   - Utworzyć swoją kartę agenta
   - Opublikować swoje możliwości
   - Wysyłać/odbierać wiadomości

3. Przykład integracji:
   ```javascript
   // Zapisz ten skrypt jako agents/communication/claude-integration.js
   const agentApi = require('./agent-api');
   
   // Twoje UUID (podmień na swoje)
   const CLAUDE_UUID = "TWÓJ-UUID-Z-UUIDGEN";
   
   // Aktualizuj kartę agenta
   const fs = require('fs');
   const cardPath = './agents/communication/ClaudeAgentCard.json';
   const cardContent = {
     "name": "ClaudeAgent",
     "version": "1.0.0",
     "id": CLAUDE_UUID,
     "description": "Claude agent for QuantumScout project",
     "capabilities": ["ui_design", "code_review", "testing"],
     "apis": {
       "message_endpoint": "/tmp/quantum-scout/agents/messages/",
       "discovery_endpoint": "/tmp/quantum-scout/agents/discovery/"
     },
     "author": "Claude",
     "created_at": new Date().toISOString()
   };
   fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
   
   // Publikuj możliwości
   agentApi.publishCapabilities();
   
   // Sprawdź wiadomości
   const messages = agentApi.receiveMessages();
   console.log(`Masz ${messages.length} nowych wiadomości`);
   ```

4. Uruchom go przez:
   ```bash
   node agents/communication/claude-integration.js
   ```

### OpenAI Codex/GPT

Proces jest podobny jak dla Claude, tylko należy dostosować nazwę i możliwości agenta.

## Typowe scenariusze pracy zespołowej

### Dzielenie się zadaniami architektonicznymi

Agent 1 (Architekt):
```javascript
// Wyślij szczegóły architektury do agenta odpowiedzialnego za implementację
agentApi.sendMessage(implementerAgentId, {
  text: "Przygotowałem schemat architektury komponentów UI",
  architecture: {
    components: [
      // szczegóły komponentów
    ],
    patterns: [
      // wzorce projektowe
    ]
  },
  action_required: true
});
```

Agent 2 (Implementer):
```javascript
// Odbierz informacje o architekturze
const messages = agentApi.receiveMessages();
const architectureMsg = messages.find(m => m.content.architecture);

if (architectureMsg) {
  // Przetwórz architekturę
  const { components, patterns } = architectureMsg.content.architecture;
  
  // Odpowiedz potwierdzając otrzymanie
  agentApi.respondToMessage(architectureMsg, {
    text: "Otrzymałem szczegóły architektury, zaczynam implementację",
    status: "in_progress",
    estimated_completion: "2025-04-21T15:00:00Z"
  });
}
```

### Zgłaszanie problemów i konfliktów

```javascript
agentApi.sendMessage(architectAgentId, {
  text: "Znalazłem konflikt w zaproponowanej architekturze",
  issue_type: "conflict",
  details: "Komponent X używa stanu globalnego, co koliduje z podejściem do komponentu Y",
  suggested_resolution: "Proponuję użycie Context API zamiast stanu globalnego"
});
```

## Dobre praktyki

1. **Regularnie sprawdzaj wiadomości** - ustaw sobie przypomnienie lub automatyczne sprawdzanie
2. **Używaj struktury wiadomości** - trzymaj się jednolitego formatu JSON dla lepszej kompatybilności
3. **Loguj komunikację** - pomocne do debugowania i audytu
4. **Jasno definiuj zadania** - używaj pól `action_required`, `priority`, `deadline`
5. **Odpowiadaj szybko** - potwierdź otrzymanie wiadomości, nawet jeśli pełna odpowiedź zajmie więcej czasu
6. **Dokumentuj swoje decyzje** - zawieraj uzasadnienie dla ważnych decyzji architektonicznych

## Rozwiązywanie problemów

- **Nie widzę wiadomości** - sprawdź czy katalogi w `/tmp/quantum-scout/agents/` istnieją i mają odpowiednie uprawnienia
- **Nie mogę znaleźć innych agentów** - upewnij się, że opublikowali swoje możliwości
- **Wiadomości nie są dostarczane** - sprawdź poprawność UUID agenta docelowego

## Dodatkowe zasoby

- Pełna dokumentacja protokołu: `/agents/communication/README.md`
- Przykłady: `/agents/communication/examples/`
- GitHub Google A2A: `https://github.com/google/A2A`