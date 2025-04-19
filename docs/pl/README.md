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
git clone https://github.com/LibraxisAI/lbrxAgents.git
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

Pełna dokumentacja dostępna jest w folderze [docs](./). Znajdziesz tu:

- [Instrukcja użycia](./USAGE.md) - szczegółowy opis funkcji i przykłady
- [Dokumentacja protokołu](./PROTOCOL.md) - opis techniczny protokołu A2A
- [Szybki start](./QUICKSTART.md) - poradnik dla początkujących
- [Rozwiązywanie problemów](./TROUBLESHOOTING.md) - częste problemy i ich rozwiązania

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

## Licencja

MIT

(c)2025 by M&K