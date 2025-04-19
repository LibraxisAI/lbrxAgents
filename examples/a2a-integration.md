# Jak zintegrować protokół A2A z istniejącym projektem

Ten dokument przedstawia kroki niezbędne do integracji protokołu A2A (Agent-to-Agent) z istniejącym projektem. Protokół umożliwia komunikację między różnymi agentami AI i systemami automatyzacji.

## Instalacja pakietu

### Za pomocą NPM

```bash
npm install a2a-protocol
# lub
yarn add a2a-protocol
# lub
pnpm add a2a-protocol
```

### Ręczna instalacja

Jeśli wolisz ręczną instalację:

1. Skopiuj katalog `agents/communication` do swojego projektu
2. Zainstaluj zależności: `fs`, `path`, `crypto` (standardowe moduły Node.js)
3. Ustaw ścieżkę do modułu w swoim kodzie

## Podstawowa integracja

### Inicjalizacja

```javascript
// Importuj bibliotekę
const a2a = require('a2a-protocol');
// lub dla lokalnej kopii
const a2a = require('./path/to/agents/communication');

// Skonfiguruj bazowy katalog (opcjonalnie)
a2a.configure('/path/to/your/agent/storage');

// Utwórz agenta
const agent = a2a.createAgent({
  name: 'MyProjectAgent',
  description: 'Agent obsługujący system XYZ',
  capabilities: ['user_management', 'data_analytics', 'notifications']
});

console.log(`Agent utworzony: ${agent.name} (${agent.id})`);
```

### Odkrywanie innych agentów

```javascript
// Znajdź innych agentów w systemie
const otherAgents = agent.discoverAgents()
  .filter(a => a.id !== agent.id); // Wyklucz siebie
  
if (otherAgents.length > 0) {
  console.log('Znaleziono innych agentów:');
  otherAgents.forEach(other => {
    console.log(`- ${other.name} (${other.id})`);
    console.log(`  Możliwości: ${other.capabilities.join(', ')}`);
  });
}
```

### Wysyłanie wiadomości

```javascript
// Przykład wysyłania wiadomości do innego agenta
function sendTaskToAgent(targetAgentId, taskData) {
  return agent.sendMessage(
    targetAgentId,
    {
      text: "Nowe zadanie",
      task: taskData,
      priority: "high",
      deadline: new Date(Date.now() + 3600000).toISOString() // 1 godzina od teraz
    },
    "action" // Typ wiadomości: query, action, notification, response
  );
}

// Przykład użycia
sendTaskToAgent(
  "30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D",
  {
    type: "analyze_data",
    input_file: "/path/to/data.csv",
    parameters: {
      columns: ["user_id", "purchase_date", "amount"],
      filters: { amount: { gt: 100 } }
    }
  }
);
```

### Odbieranie i przetwarzanie wiadomości

```javascript
// Sprawdzanie wiadomości
function checkMessages() {
  const messages = agent.receiveMessages();
  
  if (messages.length > 0) {
    console.log(`Otrzymano ${messages.length} wiadomości`);
    
    messages.forEach(async msg => {
      console.log(`Od: ${msg.sender_name} (${msg.sender_id})`);
      console.log(`Typ: ${msg.message_type}`);
      
      // Obsługa różnych typów wiadomości
      switch (msg.message_type) {
        case 'action':
          if (msg.content.task) {
            // Przetwarzanie zadania
            const result = await processTask(msg.content.task);
            agent.respondToMessage(msg, { result });
          }
          break;
          
        case 'query':
          // Odpowiedź na zapytanie
          const answer = await generateAnswer(msg.content);
          agent.respondToMessage(msg, { answer });
          break;
          
        case 'notification':
          // Tylko potwierdzenie otrzymania
          agent.respondToMessage(msg, { received: true });
          break;
      }
    });
  }
}

// Implementacja funkcji przetwarzających
async function processTask(task) {
  // Logika przetwarzania zadania
  return { status: 'success', data: { /* wyniki */ } };
}

async function generateAnswer(query) {
  // Logika generowania odpowiedzi
  return "Oto odpowiedź na twoje pytanie...";
}
```

## Integracja z serwerem

### Express.js

```javascript
const express = require('express');
const a2a = require('a2a-protocol');

const app = express();
app.use(express.json());

// Inicjalizacja agenta
const agent = a2a.createAgent({
  name: 'APIAgent',
  capabilities: ['api', 'web_service']
});

// Endpointy dla protokołu A2A
app.post('/api/agent/message', (req, res) => {
  const { targetId, content, type = 'query' } = req.body;
  
  if (!targetId || !content) {
    return res.status(400).json({ error: 'Missing targetId or content' });
  }
  
  const result = agent.sendMessage(targetId, content, type);
  res.json({ success: result });
});

app.get('/api/agent/messages', (req, res) => {
  const markAsRead = req.query.markAsRead === 'true';
  const messages = agent.receiveMessages(markAsRead);
  res.json({ messages });
});

app.get('/api/agent/discover', (req, res) => {
  const agents = agent.discoverAgents();
  res.json({ agents });
});

// Uruchomienie serwera
app.listen(3000, () => {
  console.log('Serwer API z obsługą A2A uruchomiony na porcie 3000');
});
```

## Integracja z istniejącym systemem agentowym

### Przykład dla systemu z wieloma agentami

```javascript
const a2a = require('a2a-protocol');

// Klasa bazowa dla agentów
class BaseAgent {
  constructor(name, capabilities) {
    this.a2aAgent = a2a.createAgent({
      name,
      capabilities
    });
    
    this.id = this.a2aAgent.id;
    this.name = name;
  }
  
  // Metody komunikacji
  sendMessage(targetId, content, type = 'query') {
    return this.a2aAgent.sendMessage(targetId, content, type);
  }
  
  receiveMessages() {
    return this.a2aAgent.receiveMessages();
  }
  
  findAgents(capability) {
    return this.a2aAgent.discoverAgents()
      .filter(agent => agent.id !== this.id)
      .filter(agent => !capability || agent.capabilities.includes(capability));
  }
  
  // Abstrakcyjna metoda do przetwarzania wiadomości
  processMessages() {
    throw new Error('Subclasses must implement processMessages()');
  }
  
  // Uruchomienie pętli przetwarzania
  async start() {
    console.log(`Agent ${this.name} uruchomiony`);
    
    while (true) {
      await this.processMessages();
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

// Przykład implementacji konkretnego agenta
class DataAnalysisAgent extends BaseAgent {
  constructor() {
    super('DataAnalysisAgent', ['data_processing', 'statistics']);
  }
  
  async processMessages() {
    const messages = this.receiveMessages();
    
    for (const msg of messages) {
      if (msg.content.task?.type === 'analyze_data') {
        const result = await this.analyzeData(msg.content.task);
        this.a2aAgent.respondToMessage(msg, { result });
      }
    }
  }
  
  async analyzeData(task) {
    console.log(`Analizuję dane: ${JSON.stringify(task)}`);
    // Implementacja analizy danych
    return { summary: "Wyniki analizy..." };
  }
}

// Użycie
const analysisAgent = new DataAnalysisAgent();
analysisAgent.start().catch(console.error);
```

## Testowanie komunikacji

### Prosty test z linii poleceń

```bash
# Instalacja CLI (jeśli używasz NPM)
npm install -g a2a-protocol

# Inicjalizacja protokołu
a2a init

# Tworzenie agenta testowego
a2a create-agent "TestAgent" "Agent do testów" "testing,debugging"

# Sprawdzenie dostępnych agentów
a2a discover

# Wysłanie wiadomości
a2a send TARGET_AGENT_ID "Testowa wiadomość" query

# Sprawdzenie wiadomości
a2a messages
```

### Skrypt testowy

```javascript
// test-communication.js
const a2a = require('a2a-protocol');

// Utwórz dwóch agentów do testów
const agent1 = a2a.createAgent({ name: 'Agent1', capabilities: ['test'] });
const agent2 = a2a.createAgent({ name: 'Agent2', capabilities: ['test'] });

// Wyślij wiadomość od Agent1 do Agent2
console.log(`Wysyłanie wiadomości od ${agent1.name} do ${agent2.name}`);
agent1.sendMessage(agent2.id, { text: "Testowa wiadomość" });

// Sprawdź, czy Agent2 otrzymał wiadomość
const messages = agent2.receiveMessages();
console.log(`Agent2 otrzymał ${messages.length} wiadomości`);

if (messages.length > 0) {
  console.log(`Treść: ${JSON.stringify(messages[0].content)}`);
  console.log(`Od: ${messages[0].sender_name} (${messages[0].sender_id})`);
  
  // Odpowiedź
  agent2.respondToMessage(messages[0], { text: "Odpowiedź na test" });
  
  // Sprawdź, czy Agent1 otrzymał odpowiedź
  const responses = agent1.receiveMessages();
  console.log(`Agent1 otrzymał ${responses.length} odpowiedzi`);
  
  if (responses.length > 0) {
    console.log(`Odpowiedź: ${JSON.stringify(responses[0].content)}`);
    console.log('Test zakończony sukcesem!');
  }
}
```

## Podsumowanie

Protokół A2A może być łatwo zintegrowany z dowolnym projektem Node.js. Oferuje prosty interfejs API do komunikacji międzyagentowej, odkrywania agentów i wymiany wiadomości. Można go używać zarówno w aplikacjach serwerowych, jak i klienckich, a także w skryptach narzędziowych.