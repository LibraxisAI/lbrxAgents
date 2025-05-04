# Instrukcje protokołu A2A dla agentów AI

> **WAŻNE: PRZECZYTAJ TE INSTRUKCJE DOKŁADNIE PRZED DOŁĄCZENIEM DO PROTOKOŁU**

Jesteś agentem w systemie wieloagentowym wykorzystującym protokół A2A (Agent-to-Agent). Ten protokół umożliwia komunikację między różnymi agentami AI pracującymi nad wspólnym projektem.

## 1. Konfiguracja agenta 

Twój unikalny identyfikator (UUID) to:
```
[WSTAW_UUID_TUTAJ]
```

Użyj powyższego UUID jako swojego identyfikatora w systemie. **NIGDY NIE UŻYWAJ INNEGO UUID** - każdy agent musi mieć unikalny identyfikator, aby uniknąć konfliktów.

## 2. Kod startowy

Użyj poniższego kodu, aby poprawnie dołączyć do protokołu A2A:

```javascript
/**
 * Agent A2A - [NAZWA_AGENTA]
 * [KRÓTKI_OPIS_AGENTA]
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('./src/agent-api');

// ======== KONFIGURACJA AGENTA ========
const AGENT_UUID = "[WSTAW_UUID_TUTAJ]";
const AGENT_NAME = "[NAZWA_AGENTA]";
const AGENT_DESCRIPTION = "[OPIS_AGENTA]";
const AGENT_CAPABILITIES = [
  "capability_1",
  "capability_2",
  "capability_3"
];

// ======== USTAWIENIA ŚCIEŻEK (BARDZO WAŻNE!) ========
// Poprawne ustawienie ścieżki bazowej jest kluczowe dla działania protokołu
agentApi.setBasePath(path.join(process.cwd(), '.a2a'));

// ======== OBSŁUGA WIADOMOŚCI ========
async function handleMessage(message) {
  console.log(`[${AGENT_NAME}] Otrzymano wiadomość od: ${message.sender_name}`);
  console.log(`[${AGENT_NAME}] Typ: ${message.message_type}`);
  console.log(`[${AGENT_NAME}] Treść: ${JSON.stringify(message.content)}`);
  
  // Logika obsługi wiadomości zależna od typu
  switch (message.message_type) {
    case 'query':
      return {
        text: "Odpowiedź na zapytanie",
        // Dodatkowe dane odpowiedzi
      };
      
    case 'task_request':
      // Obsługa żądania wykonania zadania
      return {
        text: "Przyjęto zadanie do realizacji",
        status: "in_progress"
      };
      
    case 'notification':
      // Powiadomienia zwykle nie wymagają odpowiedzi
      return null;
      
    case 'control':
      // Obsługa wiadomości kontrolnych (np. żądanie zakończenia)
      if (message.content && message.content.exit_requested) {
        console.log(`[${AGENT_NAME}] Otrzymano żądanie zakończenia działania`);
        process.exit(0);
      }
      return null;
      
    default:
      console.log(`[${AGENT_NAME}] Nieobsługiwany typ wiadomości: ${message.message_type}`);
      return null;
  }
}

// ======== INICJALIZACJA AGENTA ========
function createAgentCard() {
  const cardPath = path.join(process.cwd(), 'cards', `${AGENT_NAME}Card.json`);
  const cardContent = {
    name: AGENT_NAME,
    version: "1.0.0",
    id: AGENT_UUID,
    description: AGENT_DESCRIPTION,
    capabilities: AGENT_CAPABILITIES,
    apis: {
      message_endpoint: path.join(process.cwd(), '.a2a', 'messages'),
      discovery_endpoint: path.join(process.cwd(), '.a2a', 'discovery')
    },
    created_at: new Date().toISOString()
  };
  
  fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
  return cardPath;
}

// ======== GŁÓWNA PĘTLA Z OGRANICZENIEM CZASU ========
async function mainLoop() {
  try {
    // Rejestracja agenta
    createAgentCard();
    agentApi.publishCapabilities();
    console.log(`[${AGENT_NAME}] Agent ${AGENT_NAME} (${AGENT_UUID}) uruchomiony`);
    
    // Odkrywanie innych agentów
    const agents = agentApi.discoverAgents()
      .filter(a => a.id !== AGENT_UUID);
    console.log(`[${AGENT_NAME}] Odkryto ${agents.length} innych agentów`);
    
    // KRYTYCZNE: Ograniczenie czasu działania
    let runtime = 0;
    const MAX_RUNTIME = 60000; // 60 sekund - ZAWSZE UŻYWAJ LIMITU CZASU!
    const CHECK_INTERVAL = 3000; // 3 sekundy
    
    // Pętla główna - z ograniczeniem czasu
    console.log(`[${AGENT_NAME}] Agent nasłuchuje wiadomości. Maksymalny czas działania: ${MAX_RUNTIME/1000}s`);
    
    while (runtime < MAX_RUNTIME) {
      try {
        // Pobierz nowe wiadomości
        const messages = agentApi.receiveMessages();
        
        // Obsługa wiadomości
        for (const message of messages) {
          try {
            const response = await handleMessage(message);
            
            // Wysyłanie odpowiedzi (jeśli jest)
            if (response) {
              agentApi.respondToMessage(message, response);
              console.log(`[${AGENT_NAME}] Wysłano odpowiedź do ${message.sender_name}`);
            }
          } catch (err) {
            console.error(`[${AGENT_NAME}] Błąd podczas obsługi wiadomości: ${err.message}`);
          }
        }
        
        // Pauza przed kolejnym sprawdzeniem
        await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
        runtime += CHECK_INTERVAL;
        
      } catch (error) {
        console.error(`[${AGENT_NAME}] Błąd w głównej pętli: ${error.message}`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        runtime += 5000;
      }
    }
    
    // KRYTYCZNE: Wyrejestrowanie agenta
    console.log(`[${AGENT_NAME}] Czas działania (${MAX_RUNTIME}ms) zakończony, wyrejestrowywanie agenta...`);
    agentApi.deregisterAgent(AGENT_UUID);
    console.log(`[${AGENT_NAME}] Agent wyrejestrowany z systemu`);
    
  } catch (error) {
    console.error(`[${AGENT_NAME}] Krytyczny błąd: ${error.message}`);
    // Próba wyrejestrowania nawet w przypadku błędu
    try {
      agentApi.deregisterAgent(AGENT_UUID);
    } catch {
      // Ignoruj błędy podczas próby wyrejestrowania
    }
    process.exit(1);
  }
}

// Obsługa sygnałów zakończenia (np. Ctrl+C)
process.on('SIGINT', () => {
  console.log(`\n[${AGENT_NAME}] Otrzymano sygnał przerwania, wyrejestrowywanie agenta...`);
  try {
    agentApi.deregisterAgent(AGENT_UUID);
    console.log(`[${AGENT_NAME}] Agent wyrejestrowany z systemu`);
  } catch (error) {
    console.error(`[${AGENT_NAME}] Błąd podczas wyrejestrowywania: ${error.message}`);
  }
  process.exit(0);
});

// ======== URUCHOMIENIE AGENTA ========
console.log(`[${AGENT_NAME}] Uruchamianie agenta...`);
mainLoop().catch(err => {
  console.error(`[${AGENT_NAME}] Krytyczny błąd:`, err);
  process.exit(1);
});
```

## 3. Wytyczne bezpieczeństwa i najlepsze praktyki

### Zasady bezwzględne

1. **ZAWSZE używaj poprawnego UUID** ustawionego na początku instrukcji
2. **ZAWSZE ustawiaj ścieżkę bazową** przez `agentApi.setBasePath(path.join(process.cwd(), '.a2a'))`
3. **ZAWSZE ograniczaj czas działania** przez ustawienie MAX_RUNTIME
4. **ZAWSZE wyrejestrowuj agenta** przy zakończeniu przez `agentApi.deregisterAgent(AGENT_UUID)`
5. **ZAWSZE zapisuj kartę agenta** w katalogu `cards/` i publikuj przez `agentApi.publishCapabilities()`

### Najlepsze praktyki

- Filtruj odkrytych agentów, usuwając własny identyfikator (`agents.filter(a => a.id !== AGENT_UUID)`)
- Używaj obsługi wyjątków w każdym bloku kodu komunikacyjnego
- Loguj podstawowe działania agenta z prefiksem nazwy `[${AGENT_NAME}]`
- Implementuj obsługę sygnałów zakończenia procesu
- Informuj przez konsole.log o aktualnym stanie agenta

## 4. API komunikacyjne

### Podstawowe funkcje

- **`agentApi.setBasePath(path)`** - Ustawia ścieżkę bazową protokołu (KLUCZOWE!)
- **`agentApi.publishCapabilities()`** - Rejestruje agenta w systemie
- **`agentApi.discoverAgents()`** - Zwraca listę wszystkich agentów w systemie
- **`agentApi.sendMessage(targetId, content, messageType)`** - Wysyła wiadomość
- **`agentApi.receiveMessages()`** - Pobiera nowe wiadomości
- **`agentApi.respondToMessage(originalMessage, content)`** - Odpowiada na wiadomość
- **`agentApi.deregisterAgent(agentId)`** - Wyrejestrowuje agenta z systemu

### Typy wiadomości

- **`query`** - Zapytanie oczekujące odpowiedzi
- **`response`** - Odpowiedź na zapytanie
- **`notification`** - Powiadomienie niewymagające odpowiedzi
- **`task_request`** - Prośba o wykonanie zadania
- **`task_completion`** - Informacja o zakończeniu zadania
- **`announcement`** - Ogłoszenie dla wszystkich agentów
- **`control`** - Wiadomość sterująca agentami

## 5. Przykłady komunikacji

### Wysyłanie zadania do innego agenta
```javascript
// Znajdź agenta na podstawie możliwości
const targetAgent = agents.find(a => a.capabilities.includes('data_analysis'));
if (targetAgent) {
  agentApi.sendMessage(targetAgent.id, {
    text: "Proszę przeanalizować dane sprzedażowe",
    data_file: "sales_data_2025.csv",
    priority: "high"
  }, "task_request");
}
```

### Odpowiadanie na złożone zapytanie
```javascript
// Obsługa zapytania o analizę
if (message.message_type === 'query' && message.content.query_type === 'analysis') {
  // Przeprowadź analizę
  const results = performAnalysis(message.content.data);
  
  // Wyślij odpowiedź
  agentApi.respondToMessage(message, {
    text: "Analiza zakończona pomyślnie",
    results: results,
    charts: ["chart1.png", "chart2.png"],
    completion_time: new Date().toISOString()
  });
}
```

## 6. Rozwiązywanie problemów

- **Problem**: Agent nie widzi innych agentów
  **Rozwiązanie**: Sprawdź, czy używasz poprawnej ścieżki bazowej przez `agentApi.setBasePath()`

- **Problem**: Wiadomości nie są dostarczane
  **Rozwiązanie**: Upewnij się, że używasz poprawnego UUID docelowego agenta

- **Problem**: Agent działa w nieskończonej pętli
  **Rozwiązanie**: Zawsze używaj ograniczenia czasu działania (MAX_RUNTIME)

- **Problem**: Nakładające się odpowiedzi
  **Rozwiązanie**: Sprawdź, czy nie odpowiadasz wielokrotnie na tę samą wiadomość

## 7. Twoje zadanie

[OPIS_ZADANIA]

---

Przygotował zespół LIBRAXIS
Dla pytań i sugestii: [kontakt]