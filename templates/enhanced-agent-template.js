/**
 * LBRX Agent Template - Enhanced Version
 * Ulepszony szablon agenta zgodny z protokołem LBRX A2A
 * 
 * Instrukcje użycia:
 * 1. Skopiuj ten plik do katalogu examples/agents/ i zmień nazwę
 * 2. Wygeneruj nowy UUID używając "uuidgen" w terminalu
 * 3. Uzupełnij dane agenta (AGENT_UUID, AGENT_NAME, AGENT_DESCRIPTION, AGENT_CAPABILITIES)
 * 4. Zaimplementuj funkcję handleMessage() do obsługi wiadomości
 * 5. Uruchom agenta: node examples/agents/twoj-agent.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const agentApi = require('../../src/agent-api');

// ====================================
// KONFIGURACJA AGENTA - EDYTUJ TUTAJ
// ====================================

// Wygeneruj UUID używając komendy "uuidgen" w terminalu 
// i zastąp poniższy przykładowy UUID
const AGENT_UUID = "00000000-0000-0000-0000-000000000000";

// Uzupełnij dane agenta
const AGENT_NAME = "TemplateAgent";
const AGENT_DESCRIPTION = "Szablon agenta protokołu LBRX A2A";
const AGENT_CAPABILITIES = [
  "capability1",
  "capability2",
  "capability3"
];

// Domyślny tryb logowania (info, debug, error, silent)
const LOG_LEVEL = "info";

// ====================================
// NARZĘDZIA LOGOWANIA
// ====================================

/**
 * Logger - narzędzie do logowania
 */
const logger = {
  debug: (...args) => {
    if (LOG_LEVEL === 'debug') console.log('[DEBUG]', ...args);
  },
  info: (...args) => {
    if (LOG_LEVEL === 'debug' || LOG_LEVEL === 'info') console.log('[INFO]', ...args);
  },
  warn: (...args) => {
    if (LOG_LEVEL !== 'silent') console.warn('[WARN]', ...args);
  },
  error: (...args) => {
    if (LOG_LEVEL !== 'silent') console.error('[ERROR]', ...args);
  }
};

// ====================================
// OBSŁUGA WIADOMOŚCI - DOSTOSUJ SWÓJ KOD
// ====================================

/**
 * Obsługa otrzymanej wiadomości
 * @param {object} message - Obiekt wiadomości
 * @returns {object|null} - Opcjonalna odpowiedź
 */
async function handleMessage(message) {
  logger.info(`Otrzymano wiadomość od: ${message.sender_name}`);
  logger.info(`Typ: ${message.message_type}`);
  logger.debug(`Treść: ${JSON.stringify(message.content)}`);
  
  // Przykład obsługi różnych typów wiadomości
  switch (message.message_type) {
    case 'query':
      // Obsługa zapytania - wymaga odpowiedzi
      logger.debug('Obsługa zapytania');
      return {
        text: "To jest odpowiedź na twoje zapytanie",
        data: {
          // Tutaj umieść odpowiednie dane
          timestamp: new Date().toISOString()
        }
      };
      
    case 'notification':
      // Obsługa powiadomienia - nie wymaga odpowiedzi
      logger.debug('Obsługa powiadomienia');
      // Zwykle nie odpowiadamy na powiadomienia
      return null;
      
    case 'announcement':
      // Obsługa ogłoszenia - nie wymaga odpowiedzi
      logger.debug('Obsługa ogłoszenia');
      
      if (message.content && message.content.agent_details) {
        const agent = message.content.agent_details;
        logger.info(`Agent ${agent.name} (${agent.id}) ogłosił swoją obecność`);
        logger.debug(`Możliwości: ${agent.capabilities ? agent.capabilities.join(', ') : 'brak'}`);
      }
      
      return null;
      
    case 'control':
      // Obsługa wiadomości kontrolnej - krytycznie ważna!
      logger.info('Obsługa wiadomości kontrolnej');
      
      if (message.content) {
        if (message.content.control_command === 'exit_loop' || 
            message.content.emergency === true) {
          logger.info('Otrzymano polecenie zakończenia pracy');
          agentApi.requestShutdown();
          return {
            text: "Potwierdzenie otrzymania polecenia zakończenia pracy",
            status: "shutting_down"
          };
        }
      }
      
      return {
        text: "Potwierdzenie otrzymania wiadomości kontrolnej",
        status: "acknowledged"
      };
      
    case 'action':
      // Obsługa żądania akcji
      logger.debug(`Żądana akcja: ${message.content.action || 'nie określono'}`);
      
      // Symulacja wykonania akcji
      await simulateAction(message.content);
      
      return {
        text: "Akcja wykonana",
        result: {
          status: "success",
          timestamp: new Date().toISOString()
        }
      };
      
    case 'test':
      // Obsługa wiadomości testowej protokołu
      logger.info('Obsługa wiadomości testowej');
      return {
        text: "Test protokołu obsłużony pomyślnie",
        test_received: true,
        echo: message.content,
        timestamp: new Date().toISOString()
      };
      
    default:
      logger.warn(`Nieobsługiwany typ wiadomości: ${message.message_type}`);
      return null;
  }
}

// Symulacja wykonania akcji (zastąp swoim kodem)
async function simulateAction(content) {
  return new Promise((resolve) => {
    logger.debug(`Symulacja wykonywania akcji: ${content.action || 'unknown'}`);
    setTimeout(resolve, 1000);
  });
}

// ====================================
// INICJALIZACJA AGENTA
// ====================================

// Sprawdzenie poprawności UUID
function validateAndFixUUID() {
  if (!AGENT_UUID || 
      AGENT_UUID === '00000000-0000-0000-0000-000000000000' ||
      AGENT_UUID.length !== 36) {
    
    logger.warn('UWAGA: Nie podano poprawnego UUID!');
    logger.warn('Generowanie nowego UUID...');
    
    // Generowanie nowego UUID
    const newUUID = crypto.randomUUID().toUpperCase();
    logger.info(`Wygenerowano nowy UUID: ${newUUID}`);
    logger.warn('WAŻNE: Zaktualizuj plik agenta z nowym UUID!');
    
    return newUUID;
  }
  
  return AGENT_UUID;
}

// Utworzenie karty agenta
function createAgentCard(uuid) {
  const cardsDir = path.join(process.cwd(), 'cards');
  
  // Upewnij się, że katalog cards istnieje
  if (!fs.existsSync(cardsDir)) {
    fs.mkdirSync(cardsDir, { recursive: true });
  }
  
  const cardPath = path.join(cardsDir, `${AGENT_NAME.replace(/\s+/g, '')}Card.json`);
  const cardContent = {
    name: AGENT_NAME,
    version: "1.0.0",
    id: uuid,
    description: AGENT_DESCRIPTION,
    capabilities: AGENT_CAPABILITIES,
    apis: {
      message_endpoint: path.join(process.cwd(), '.a2a', 'messages'),
      discovery_endpoint: path.join(process.cwd(), '.a2a', 'discovery')
    },
    author: AGENT_NAME,
    created_at: new Date().toISOString()
  };
  
  fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
  logger.info(`Utworzono kartę agenta: ${cardPath}`);
  
  return cardPath;
}

// ====================================
// GŁÓWNA LOGIKA AGENTA
// ====================================

// Główna pętla
async function mainLoop() {
  logger.info('Inicjalizacja agenta...');
  
  // Sprawdź UUID
  const validUuid = validateAndFixUUID();
  
  // Sprawdź, czy struktura katalogów protokołu istnieje
  const baseDir = path.join(process.cwd(), '.a2a');
  if (!fs.existsSync(baseDir)) {
    logger.info('Tworzenie struktury katalogów protokołu...');
    fs.mkdirSync(baseDir, { recursive: true });
    fs.mkdirSync(path.join(baseDir, 'messages'), { recursive: true });
    fs.mkdirSync(path.join(baseDir, 'discovery'), { recursive: true });
    fs.mkdirSync(path.join(baseDir, 'status'), { recursive: true });
  }
  
  // Tworzenie karty agenta
  const cardPath = createAgentCard(validUuid);
  
  // Ustaw ścieżkę karty agenta
  agentApi.setAgentCardPath(cardPath);
  
  // Włączenie obsługi zakończenia procesu
  agentApi.enableShutdownHandlers();
  
  // Zarejestruj handler wyłączenia
  agentApi.onShutdown(() => {
    logger.info(`Agent ${AGENT_NAME} kończy działanie`);
    return Promise.resolve();
  });
  
  // Publikacja możliwości
  agentApi.publishCapabilities();
  logger.info(`Agent ${AGENT_NAME} (${validUuid}) uruchomiony`);
  
  // Odkrywanie innych agentów
  const agents = agentApi.discoverAgents()
    .filter(a => a.id !== validUuid);
  logger.info(`Odkryto ${agents.length} innych agentów`);
  
  // Pętla sprawdzania wiadomości
  logger.info("Nasłuchuję wiadomości od innych agentów...");
  logger.info("Wciśnij Ctrl+C, aby zakończyć działanie.");
  
  // Główna pętla - z bezpiecznym mechanizmem wyjścia
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
            logger.info(`Wysłano odpowiedź do ${message.sender_name}`);
          }
        } catch (err) {
          logger.error(`Błąd podczas obsługi wiadomości: ${err.message}`);
        }
      }
      
      // Ping statusu
      agentApi.pingAgent();
      
      // Krótka przerwa przed następnym sprawdzeniem
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      logger.error(`Błąd w głównej pętli: ${error.message}`);
      
      // Dłuższa przerwa po błędzie
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  logger.info("Zakończono główną pętlę agenta.");
}

// ====================================
// URUCHOMIENIE AGENTA
// ====================================

// Sprawdź, czy UUID został zmieniony
if (AGENT_UUID === "00000000-0000-0000-0000-000000000000") {
  logger.warn("UWAGA: Nie zmieniłeś domyślnego UUID!");
  logger.warn("Wygeneruj nowy UUID używając komendy 'uuidgen' w terminalu i zaktualizuj AGENT_UUID.");
  logger.warn("Agent zostanie uruchomiony z wygenerowanym UUID, ale pamiętaj o aktualizacji kodu źródłowego!");
}

// Uruchom agenta z obsługą błędów
mainLoop().catch(err => {
  logger.error("Krytyczny błąd:", err);
  process.exit(1);
});