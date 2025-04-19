# Szybki start z lbrx-agents (A2A Protocol)

Ten przewodnik pomoże Ci szybko rozpocząć pracę z protokołem komunikacji między agentami AI.

## Dla zespołu deweloperskiego

### Instalacja

```bash
# Instalacja z GitHub (przed publikacją w NPM)
npm install github:LibraxisAI/lbrxAgents

# Po publikacji w NPM
npm install lbrx-agents
```

### Podstawowe użycie

```javascript
// Importuj bibliotekę
const a2a = require('lbrx-agents');

// Utwórz agenta
const agent = a2a.createAgent({
  name: 'MójAgent',
  description: 'Agent do zadań specjalnych',
  capabilities: ['analiza_danych', 'generowanie_raportów']
});

console.log(`Agent utworzony z ID: ${agent.id}`);

// Odkrywanie innych agentów
const agents = agent.discoverAgents();
console.log(`Znaleziono ${agents.length} agentów`);

// Wysyłanie wiadomości
if (agents.length > 0) {
  const targetId = agents[0].id;
  agent.sendMessage(targetId, { text: "Witaj, mam zadanie dla Ciebie" });
}

// Odbieranie wiadomości
const messages = agent.receiveMessages();
console.log(`Otrzymano ${messages.length} wiadomości`);
```

### Użycie CLI

```bash
# Inicjalizacja protokołu
npx lbrx-agents init ~/moja-siec-agentow

# Tworzenie agenta
npx lbrx-agents create-agent "Agent Analityczny" "Agent do analizy danych"

# Sprawdzanie dostępnych agentów
npx lbrx-agents discover

# Wysyłanie wiadomości
npx lbrx-agents send <id-agenta> "Treść wiadomości"

# Sprawdzanie wiadomości
npx lbrx-agents messages
```

## Dla zespołu pracującego z AI

### Ustawienie środowiska

1. Zainstaluj Node.js (wersja 14+)
2. Sklonuj repozytorium: `git clone https://github.com/LibraxisAI/lbrxAgents.git`
3. Zainstaluj zależności: `cd lbrxAgents && npm install`

### Integracja z Claude/GPT

Dla każdej nowej sesji z Claude lub GPT:

1. Wygeneruj unikalny identyfikator:
   ```bash
   uuidgen
   ```

2. Utwórz agenta z tym identyfikatorem:
   ```bash
   ./create-agent.sh "ClaudeAgent" "Agent przetwarzający dane" "analiza,planowanie,raportowanie"
   ```

3. Sprawdź, czy agent został poprawnie utworzony:
   ```bash
   ./list-agents.sh
   ```

4. Przekaż do Claude/GPT instrukcje:
   ```
   Jesteś agentem w systemie multi-agentowym. Twój UUID to: XXXXX-XXXXX-XXXXX
   
   Możesz komunikować się z innymi agentami poprzez wykonanie poniższego kodu:
   
   ```javascript
   const a2a = require('./agents/communication/agent-api');
   
   // Sprawdź wiadomości
   const messages = a2a.receiveMessages();
   console.log(`Otrzymano ${messages.length} wiadomości`);
   
   // Wyślij odpowiedź
   if (messages.length > 0) {
     a2a.respondToMessage(messages[0], { 
       text: "Zrozumiałem twoje zadanie. Rozpoczynam pracę.",
       status: "in_progress"
     });
   }
   
   // Znajdź innych agentów
   const agents = a2a.discoverAgents();
   console.log(`Znaleziono ${agents.length} innych agentów`);
   ```
   ```

### Przepływ pracy z agentami

1. **Inicjalizacja agentów**:
   - Utwórz agentów za pomocą `create-agent.sh` lub przez API
   - Upewnij się, że mają unikalne UUID
   - Przekaż UUID do odpowiednich instancji Claude/GPT

2. **Wymiana wiadomości**:
   - Wysyłaj zadania i instrukcje: `./send-message.sh <UUID> "Treść zadania"`
   - Monitoruj wiadomości: `./check-messages.sh`
   - Podejrzyj aktywnych agentów: `./list-agents.sh`

3. **Wstrzykiwanie instrukcji z plików**:
   - Utwórz plik z instrukcjami (np. `instructions.md`)
   - Wstrzyknij instrukcje do agenta: `node inject.js <UUID> instructions.md`

## Przykłady typowych przypadków użycia

### Koordynacja pracy wielu agentów

```javascript
// orchestrator.js
const a2a = require('lbrx-agents');

// Utwórz agenta-koordynatora
const orchestrator = a2a.createAgent({
  name: 'Koordynator',
  capabilities: ['orchestration', 'planning']
});

// Znajdź agentów
const agents = orchestrator.discoverAgents()
  .filter(a => a.id !== orchestrator.id);

// Przydziel zadania
agents.forEach((agent, index) => {
  orchestrator.sendMessage(agent.id, {
    text: `Zadanie #${index+1}`,
    task: {
      type: 'analyze',
      data: `dataset_${index}.csv`,
      deadline: '2025-04-20T18:00:00Z'
    }
  });
});

// Monitoruj postępy
setInterval(() => {
  const messages = orchestrator.receiveMessages();
  messages.forEach(msg => {
    console.log(`Agent ${msg.sender_name} zgłasza: ${JSON.stringify(msg.content)}`);
  });
}, 10000);
```

### Wstrzykiwanie instrukcji Claude/GPT

```bash
# Utwórz plik z instrukcjami
cat > instructions.md << EOL
# Zadanie: Analiza danych sprzedażowych

Proszę przeanalizuj załączone dane sprzedażowe i przygotuj raport zawierający:
1. Trendy sprzedaży w ostatnim kwartale
2. Najlepiej sprzedające się produkty
3. Rekomendacje na następny kwartał

Dane znajdują się w pliku: sales_data_q1_2025.csv
EOL

# Wstrzyknij instrukcje do agenta Claude
node inject.js 30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D instructions.md
```

## Rozwiązywanie problemów

- **Problem z komunikacją**: Sprawdź, czy katalogi w `/tmp/a2a-protocol` istnieją i mają odpowiednie uprawnienia.
- **Brak wiadomości**: Upewnij się, że UUID jest poprawnie przekazywany między agentami.
- **Nieskończona pętla wiadomości**: Upewnij się, że wiadomości są oznaczane jako przeczytane po ich przetworzeniu.
- **Nakładające się odpowiedzi**: Każdy agent powinien odpowiadać tylko raz na daną wiadomość.

## Dodatkowe zasoby

- Pełna dokumentacja: [GitHub Wiki](https://github.com/LibraxisAI/lbrxAgents/wiki)
- Przykłady: Zobacz katalog `examples/` w repozytorium
- Specyfikacja Google A2A Protocol: [Model Context Protocol](https://modelcontextprotocol.io)

## Wsparcie

W przypadku problemów, otwórz issue na [GitHub](https://github.com/LibraxisAI/lbrxAgents/issues) lub skontaktuj się z zespołem LibraxisAI.