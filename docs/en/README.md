# lbrxAgents - System komunikacji międzyagentowej A2A

Protokół komunikacji A2A (Agent-to-Agent) umożliwiający współpracę wielu autonomicznych agentów AI (Claude, GPT, Gemini, itp.) nad jednym projektem.

## Główne funkcje

- Dynamiczne wykrywanie i rejestracja agentów
- Wymiana wiadomości między agentami
- Koordynacja pracy przez agenta-orkiestratora
- Śledzenie statusu aktywności agentów
- Bezpieczne zakończenie pracy agentów
- Standardowa struktura katalogów w projekcie

## Szybki start

### Instalacja

```bash
# Sklonuj repozytorium do swojego projektu
git clone https://github.com/username/lbrxAgents.git
cd lbrxAgents

# Lub zainstaluj przez npm
npm install lbrxagents
```

### Uruchomienie agenta

```bash
# 1. Skopiuj szablon agenta
cp agent-template.js my-agent.js

# 2. Edytuj dane agenta w pliku my-agent.js

# 3. Uruchom agenta
node my-agent.js
```

### Uruchomienie orkiestratora

```bash
# 1. Skopiuj szablon orkiestratora
cp OrchestratorTemplate.js my-orchestrator.js

# 2. Edytuj dane projektu w pliku my-orchestrator.js

# 3. Uruchom orkiestratora
node my-orchestrator.js
```

## Struktura projektu

```
lbrxAgents/
├── agent-api.js            # Główne API do komunikacji między agentami
├── agent-template.js       # Szablon agenta
├── OrchestratorTemplate.js # Szablon orkiestratora
├── USAGE.md                # Szczegółowa dokumentacja
├── PROTOCOL_README.md      # Dokumentacja protokołu
└── examples/               # Przykłady użycia
    ├── multi-agent-system.js
    ├── listen-for-tasks.js
    └── send-message.js
```

## Dokumentacja

Pełna dokumentacja dostępna jest w pliku [USAGE.md](./USAGE.md).
Szczegóły techniczne protokołu opisane są w [PROTOCOL_README.md](./PROTOCOL_README.md).

## Przykłady

### Wymiana wiadomości między agentami

```javascript
const agentApi = require('./agent-api');

// Wysyłanie wiadomości
agentApi.sendMessage('id-odbiorcy', {
  text: 'Cześć, mam pytanie o architekturę',
  component: 'UserInterface'
}, 'query');

// Odbieranie wiadomości
const messages = agentApi.receiveMessages();
messages.forEach(msg => {
  console.log(`Wiadomość od: ${msg.sender_name}`);
  console.log(`Treść: ${msg.content.text}`);
});
```

### Odkrywanie innych agentów

```javascript
const agentApi = require('./agent-api');

// Lista wszystkich agentów
const allAgents = agentApi.discoverAgents();
console.log(`Znaleziono ${allAgents.length} agentów:`);
allAgents.forEach(agent => {
  console.log(`- ${agent.name} (${agent.id}): ${agent.description}`);
});

// Lista aktywnych agentów
const activeAgents = agentApi.discoverAgents({onlyActive: true});
console.log(`Aktywnych agentów: ${activeAgents.length}`);
```

## Korzystanie z CLI

Pakiet zawiera narzędzie CLI do łatwego testowania:

```bash
# Listuj dostępnych agentów
node agent-cli.js discover

# Wysyłanie wiadomości
node agent-cli.js send <agent_id> "Treść wiadomości" 

# Sprawdzanie wiadomości
node agent-cli.js messages

# Monitorowanie nowych wiadomości
node agent-cli.js watch
```

## Integracja z modelami AI

### Claude Code

```javascript
// claude-integration.js
const agentApi = require('./agent-api');

// Wygeneruj UUID
const CLAUDE_UUID = "574A8FCD-8FB4-4DEC-A26F-0B9ACFDA5A12"; // lub użyj uuidgen w terminalu

// Utwórz kartę agenta
const fs = require('fs');
const cardPath = './ClaudeAgentCard.json';
const cardContent = {
  name: "ClaudeTestingAgent",
  version: "1.0.0",
  id: CLAUDE_UUID,
  description: "Claude agent for testing protocol",
  capabilities: [
    "protocol_testing",
    "code_review",
    "bug_reporting"
  ],
  apis: {
    message_endpoint: "/tmp/quantum-scout/agents/messages/",
    discovery_endpoint: "/tmp/quantum-scout/agents/discovery/"
  },
  author: "Claude",
  created_at: new Date().toISOString()
};
fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));

// Publikuj możliwości
agentApi.publishCapabilities(cardPath);

// Sprawdź wiadomości
const messages = agentApi.receiveMessages();
console.log(`Otrzymano ${messages.length} wiadomości`);
```

## Licencja

MIT