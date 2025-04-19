# lbrxAgents - Szybki start

Ten poradnik przeprowadzi Cię przez proces instalacji i konfiguracji biblioteki lbrxAgents do komunikacji międzyagentowej.

## Instalacja

### Metoda 1: Klonowanie repozytorium

```bash
git clone https://github.com/LibraxisAI/lbrxAgents.git
cd lbrxAgents
```

### Metoda 2: Instalacja przez npm

```bash
npm install lbrxagents
```

## Tworzenie pierwszego agenta

### Krok 1: Skopiuj szablon agenta

```bash
cp agent-template.js my-first-agent.js
```

### Krok 2: Edytuj dane agenta

Otwórz plik `my-first-agent.js` i zmodyfikuj następujące sekcje:

```javascript
// Zastąp to swoimi danymi
const AGENT_NAME = "MojPierwszyAgent";
const AGENT_DESCRIPTION = "Mój pierwszy agent w protokole A2A";
const AGENT_CAPABILITIES = [
  "text_processing",
  "data_analysis",
  "task_execution"
];
```

### Krok 3: Zaimplementuj obsługę wiadomości

Zmodyfikuj funkcję `handleMessage` aby reagowała na różne typy wiadomości:

```javascript
async function handleMessage(message) {
  console.log(`Otrzymano wiadomość od: ${message.sender_name}`);
  console.log(`Typ: ${message.message_type}`);
  console.log(`Treść: ${JSON.stringify(message.content)}`);
  
  switch (message.message_type) {
    case 'query':
      return {
        text: "Odpowiedź na Twoje zapytanie",
        data: {
          result: "Oto wynik analizy",
          timestamp: new Date().toISOString()
        }
      };
      
    // Dodaj obsługę innych typów wiadomości...
      
    default:
      console.log(`Nieobsługiwany typ wiadomości: ${message.message_type}`);
      return null;
  }
}
```

### Krok 4: Uruchom agenta

```bash
node my-first-agent.js
```

Po uruchomieniu agent automatycznie:
1. Utworzy swój plik karty agenta
2. Opublikuje swoje możliwości
3. Odkryje innych agentów w systemie
4. Rozpocznie nasłuchiwanie wiadomości

## Komunikacja między agentami

### Wysyłanie wiadomości

Aby wysłać wiadomość do innego agenta, potrzebujesz jego identyfikatora UUID:

```javascript
const agentApi = require('./agent-api');

// ID docelowego agenta (możesz go uzyskać używając agentApi.discoverAgents())
const targetAgentId = "30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D";

agentApi.sendMessage(targetAgentId, {
  text: "Cześć, mam pytanie o architekturę komponentów",
  component: "UserInterface",
  priority: "high"
}, 'query');
```

### Odbieranie i odpowiadanie na wiadomości

Wiadomości są automatycznie odbierane w głównej pętli agenta. Jeśli chcesz odpowiedzieć na wiadomość poza główną pętlą:

```javascript
const agentApi = require('./agent-api');

// Pobierz wiadomości
const messages = agentApi.receiveMessages();

// Odpowiedz na pierwszą wiadomość
if (messages.length > 0) {
  agentApi.respondToMessage(messages[0], {
    text: "Oto odpowiedź na Twoje pytanie",
    data: {
      // dane odpowiedzi
    }
  });
}
```

## Uruchomienie orkiestratora

Orkiestrator to specjalny agent koordynujący pracę zespołu agentów.

### Krok 1: Skopiuj szablon orkiestratora

```bash
cp OrchestratorTemplate.js my-orchestrator.js
```

### Krok 2: Dostosuj konfigurację projektu

```javascript
// Konfiguracja projektu
const PROJECT = {
  name: "MójProjekt",
  description: "Opis mojego projektu",
  version: "1.0.0",
  status: "in_progress"
};
```

### Krok 3: Uruchom orkiestratora

```bash
node my-orchestrator.js
```

Po uruchomieniu orkiestrator:
1. Opublikuje swoje możliwości
2. Utworzy globalne instrukcje
3. Odkryje aktywnych agentów
4. Rozpocznie koordynację pracy zespołu

## Korzystanie z narzędzia CLI

Pakiet zawiera narzędzie CLI do łatwego testowania i debugowania:

```bash
# Listuj dostępnych agentów
node agent-cli.js discover

# Wysyłanie wiadomości
node agent-cli.js send 30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D "Cześć, to jest wiadomość testowa"

# Sprawdzanie wiadomości
node agent-cli.js messages

# Monitorowanie nowych wiadomości
node agent-cli.js watch
```

## Następne kroki

- Zapoznaj się z pełną [dokumentacją API](./USAGE.md)
- Przestudiuj [dokumentację protokołu](./PROTOCOL.md)
- Sprawdź [przykłady integracji](../examples) z różnymi modelami AI
- W razie problemów, zajrzyj do [poradnika rozwiązywania problemów](./TROUBLESHOOTING.md)