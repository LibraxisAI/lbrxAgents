/**
 * Agent Template 
 * 
 * To dołączyć nowy agent do projektu:
 * 1. Skopiuj ten plik i zmień nazwę
 * 2. Wypełnij dane agenta poniżej
 * 3. Zaimplementuj handleMessage() do obsługi wiadomości
 * 4. Uruchom agenta: node twoj-agent.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const agentApi = require('./agent-api');

// ====================================
// KONFIGURACJA AGENTA - EDYTUJ TUTAJ
// ====================================

// Identyfikator roli agenta (backenddev, uiuxdev, itp.) - używany do ciągłości funkcji
const AGENT_ID = process.env.AGENT_ID || "NazwaAgenta";

// Unikalny identyfikator sesji - generowany dla każdej sesji terminala
const SESSION_ID = process.env.SESSION_ID || generateSessionId();

// Połączony identyfikator używany w systemie
const AGENT_UUID = `${AGENT_ID}__${SESSION_ID}`;

// Zastąp to swoimi danymi
const AGENT_NAME = AGENT_ID; // Używamy AGENT_ID jako nazwy
const AGENT_DESCRIPTION = "Opis twojego agenta i jego roli";
const AGENT_CAPABILITIES = [
  "capability1",
  "capability2",
  "capability3"
];

// ====================================
// OBSŁUGA WIADOMOŚCI - DOSTOSUJ SWÓJ KOD
// ====================================

/**
 * Obsługa otrzymanej wiadomości
 * @param {object} message - Obiekt wiadomości
 * @returns {object|null} - Opcjonalna odpowiedź
 */
async function handleMessage(message) {
  console.log(`Otrzymano wiadomość od: ${message.sender_name}`);
  console.log(`Typ: ${message.message_type}`);
  console.log(`Treść: ${JSON.stringify(message.content)}`);
  
  // Przykład obsługi różnych typów wiadomości
  switch (message.message_type) {
    case 'query':
      // Obsługa zapytania
      return {
        text: "To jest odpowiedź na twoje zapytanie",
        data: {
          // Tutaj umieść odpowiednie dane
        }
      };
      
    case 'notification':
      // Obsługa powiadomienia
      console.log("Otrzymano powiadomienie");
      // Zwykle nie odpowiadamy na powiadomienia
      return null;
      
    case 'announcement':
      // Obsługa ogłoszenia (np. dołączenie nowego agenta)
      console.log("Otrzymano ogłoszenie o dołączeniu/zmianie agenta");
      if (message.content && message.content.agent_details) {
        const { name, id } = message.content.agent_details;
        console.log(`Agent ${name} (${id}) dołączył do systemu`);
      }
      return null;
      
    case 'action':
      // Obsługa żądania akcji
      console.log(`Żądana akcja: ${message.content.action}`);
      // Symulacja wykonania akcji
      await simulateAction(message.content);
      return {
        text: "Akcja wykonana",
        result: {
          status: "success",
          timestamp: new Date().toISOString()
        }
      };
    
    case 'control':
      // Obsługa wiadomości kontrolnych
      console.log("Otrzymano wiadomość kontrolną");
      if (message.content && message.content.control_command === 'exit_loop') {
        console.log("Otrzymano polecenie zakończenia pętli, zamykam agenta...");
        agentApi.requestShutdown();
      }
      return null;
      
    default:
      console.log(`Nieobsługiwany typ wiadomości: ${message.message_type}`);
      return null;
  }
}

// Symulacja wykonania akcji (zastąp swoim kodem)
async function simulateAction(content) {
  return new Promise((resolve) => {
    console.log(`Symulacja wykonywania akcji: ${content.action || 'unknown'}`);
    setTimeout(resolve, 1000);
  });
}

// ====================================
// FUNKCJE POMOCNICZE - NIE ZMIENIAJ
// ====================================

// Generuje unikalny identyfikator sesji
function generateSessionId() {
  // Generuj losowy UUID dla sesji
  return crypto.randomUUID();
}

// Ustawienie logowania sesji
const SESSION_LOG_DIR = path.join(process.cwd(), 'lbrxAgents', '.a2a', 'logs');
// Upewnij się, że katalog logów istnieje
if (!fs.existsSync(SESSION_LOG_DIR)) {
  fs.mkdirSync(SESSION_LOG_DIR, { recursive: true });
}

// Inicjalizacja logowania sesji
const SESSION_LOG_PATH = path.join(SESSION_LOG_DIR, `${AGENT_ID}__${SESSION_ID}.log`);
const sessionLogger = fs.createWriteStream(SESSION_LOG_PATH, { flags: 'a' });

// Zapisz początek sesji
sessionLogger.write(`\n[${new Date().toISOString()}] === ROZPOCZĘCIE SESJI AGENTA ${AGENT_NAME} (${AGENT_UUID}) ===\n`);

// Przechwytujemy wyjścia standardowe
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Nadpisujemy console.log
console.log = function() {
  const args = Array.from(arguments);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  
  sessionLogger.write(`[${new Date().toISOString()}] LOG: ${message}\n`);
  originalConsoleLog.apply(console, arguments);
};

// Nadpisujemy console.error
console.error = function() {
  const args = Array.from(arguments);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  
  sessionLogger.write(`[${new Date().toISOString()}] ERROR: ${message}\n`);
  originalConsoleError.apply(console, arguments);
};

// Nadpisujemy console.warn
console.warn = function() {
  const args = Array.from(arguments);
  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
  ).join(' ');
  
  sessionLogger.write(`[${new Date().toISOString()}] WARN: ${message}\n`);
  originalConsoleWarn.apply(console, arguments);
};

// Rejestrujemy handler do zapisania informacji o zamknięciu sesji
process.on('exit', () => {
  sessionLogger.write(`[${new Date().toISOString()}] === ZAKOŃCZENIE SESJI AGENTA ${AGENT_NAME} (${AGENT_UUID}) ===\n`);
  sessionLogger.end();
});

// Generuje deterministyczny UUID na podstawie nazwy agenta
function generateAgentId() {
  if (process.env.AGENT_UUID) {
    return process.env.AGENT_UUID;
  }
  
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // UUID przestrzeni nazw
  return crypto.createHash('sha1')
    .update(namespace + AGENT_NAME)
    .digest('hex')
    .substring(0, 8) + '-' +
    crypto.createHash('sha1')
      .update(namespace + AGENT_NAME + AGENT_DESCRIPTION)
      .digest('hex')
      .substring(0, 4) + '-' +
    '4' + // Wersja 4 UUID
    crypto.createHash('sha1')
      .update(namespace + AGENT_NAME + Date.now().toString())
      .digest('hex')
      .substring(0, 3) + '-' +
    crypto.randomBytes(2).toString('hex') + '-' +
    crypto.createHash('sha1')
      .update(namespace + AGENT_NAME + AGENT_DESCRIPTION + Date.now().toString())
      .digest('hex')
      .substring(0, 12);
}

// Utworzenie karty agenta
function createAgentCard() {
  const cardPath = path.join(__dirname, `${AGENT_NAME}Card.json`);
  const cardContent = {
    name: AGENT_NAME,
    version: "1.0.0",
    id: AGENT_UUID,
    agent_id: AGENT_ID,  // Dodajemy identyfikator roli agenta
    session_id: SESSION_ID, // Dodajemy identyfikator sesji
    description: AGENT_DESCRIPTION,
    capabilities: AGENT_CAPABILITIES,
    apis: {
      message_endpoint: path.join(process.cwd(), 'lbrxAgents', '.a2a', 'messages'),
      discovery_endpoint: path.join(process.cwd(), 'lbrxAgents', '.a2a', 'discovery')
    },
    author: AGENT_NAME,
    created_at: new Date().toISOString()
  };
  
  fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
  return cardPath;
}

// Sprawdź status i instrukcje orkiestratora
function checkOrchestratorStatus() {
  const orchestratorInfo = agentApi.getOrchestratorInfo();
  if (orchestratorInfo) {
    console.log(`Znaleziono orkiestratora: ${orchestratorInfo.name} (${orchestratorInfo.id})`);
    
    const status = agentApi.getOrchestratorStatus();
    if (status.status !== 'unknown') {
      console.log(`Status orkiestratora: ${status.status}`);
      console.log(`Ostatnia aktualizacja: ${status.last_update || 'unknown'}`);
      if (status.message) {
        console.log(`Wiadomość: ${status.message}`);
      }
    }
  } else {
    console.log("Nie znaleziono orkiestratora w systemie");
  }
}

// Główna pętla
async function mainLoop() {
  // Tworzenie karty agenta
  createAgentCard();
  
  // Włączenie obsługi zakończenia procesu
  agentApi.enableShutdownHandlers();
  
  // Publikacja możliwości i ogłoszenie obecności
  agentApi.publishCapabilities();
  console.log(`Agent ${AGENT_NAME} (${AGENT_UUID}) uruchomiony`);
  
  // Sprawdź status orkiestratora
  checkOrchestratorStatus();
  
  // Odkrywanie innych agentów
  const agents = agentApi.discoverAgents()
    .filter(a => a.id !== AGENT_UUID);
  console.log(`Odkryto ${agents.length} innych agentów:`);
  agents.forEach(agent => {
    console.log(`- ${agent.name} (${agent.id}) - Status: ${agent.status || 'unknown'}`);
  });
  
  // Zarejestruj handler wyłączenia agenta
  agentApi.onShutdown(() => {
    console.log(`Agent ${AGENT_NAME} kończy działanie`);
    // Wyrejestrowanie agenta przy zamknięciu
    agentApi.deregisterAgent(AGENT_UUID);
    return Promise.resolve();
  });
  
  // Okresowe pingowanie statusu (co minutę)
  const pingInterval = setInterval(() => {
    if (!agentApi.isShutdownRequested()) {
      agentApi.pingAgent(AGENT_UUID);
    } else {
      clearInterval(pingInterval);
    }
  }, 60000);
  
  // Pętla sprawdzania wiadomości
  while (!agentApi.isShutdownRequested()) {
    try {
      // Pobierz nowe wiadomości
      const messages = agentApi.receiveMessages();
      
      // Obsługa wiadomości
      for (const message of messages) {
        try {
          const response = await handleMessage(message);
          
          // Jeśli mamy odpowiedź, wyślij ją
          if (response) {
            agentApi.respondToMessage(message, response);
            console.log(`Wysłano odpowiedź do ${message.sender_name}`);
          }
        } catch (err) {
          console.error(`Błąd podczas obsługi wiadomości: ${err.message}`);
        }
      }
      
      // Czekaj przed kolejnym sprawdzeniem
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`Błąd w głównej pętli: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Posprzątaj przy wyjściu
  clearInterval(pingInterval);
  console.log("Pętla agenta zakończona");
}

// Uruchom agenta
mainLoop().catch(err => {
  console.error("Krytyczny błąd:", err);
  process.exit(1);
});