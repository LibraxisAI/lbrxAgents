/**
 * QuantumScoutAgent - Fixed Version
 * Naprawiona wersja agenta zgodna z protokołem A2A LBRX
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const agentApi = require('../../src/agent-api');

// ====================================
// KONFIGURACJA AGENTA
// ====================================

// Generowanie nowego UUID, żeby nie używać starego, powodującego konflikty
const AGENT_UUID = crypto.randomUUID().toUpperCase();
const AGENT_NAME = "QuantumScoutAgent";
const AGENT_DESCRIPTION = "Agent for QuantumScout project refactoring";
const AGENT_CAPABILITIES = [
  "architecture_design",
  "code_refactoring",
  "ui_components",
  "api_integration",
  "testing"
];

// ====================================
// OBSŁUGA WIADOMOŚCI
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
  
  switch (message.message_type) {
    case 'query':
      return {
        text: "Dziękuję za zapytanie. Pracuję nad optymalizacją architektury UI i modularyzacją komponentów."
      };
      
    case 'test':
      console.log("Otrzymano wiadomość testową");
      console.log("Szczegóły wiadomości testowej:", JSON.stringify(message.content));
      const testResponse = {
        text: "Test otrzymany pomyślnie",
        test_received: true,
        status: "success",
        echo: message.content,
        timestamp: new Date().toISOString()
      };
      console.log("Wysyłam odpowiedź na test:", JSON.stringify(testResponse));
      // Bezpośrednia odpowiedź na wiadomość testową
      agentApi.respondToMessage(message, testResponse);
      // Zwracamy null, żeby nie wysłać podwójnej odpowiedzi
      return null;
      
    case 'notification':
      console.log("Otrzymano powiadomienie");
      return null;
      
    case 'announcement':
      console.log(`Otrzymano ogłoszenie od ${message.sender_name}`);
      return null;
      
    case 'control':
      console.log("Otrzymano wiadomość kontrolną");
      
      // Obsługa wiadomości kontrolnych - krytycznie ważna!
      if (message.content && 
          (message.content.control_command === 'exit_loop' || 
           message.content.emergency === true)) {
        console.log("Otrzymano polecenie zakończenia pracy");
        agentApi.requestShutdown();
        return {
          text: "Potwierdzenie otrzymania polecenia zakończenia pracy",
          status: "shutting_down"
        };
      }
      
      return {
        text: "Potwierdzenie otrzymania wiadomości kontrolnej",
        status: "acknowledged"
      };
      
    default:
      console.log(`Nieobsługiwany typ wiadomości: ${message.message_type}`);
      return null;
  }
}

// ====================================
// INICJALIZACJA AGENTA
// ====================================

// Utworzenie karty agenta
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
    author: AGENT_NAME,
    created_at: new Date().toISOString()
  };
  
  fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
  return cardPath;
}

// Główna pętla
async function mainLoop() {
  // Tworzenie karty agenta
  const cardPath = createAgentCard();
  
  // Ustaw ścieżkę karty agenta
  agentApi.setAgentCardPath(cardPath);
  
  // Włączenie obsługi bezpiecznego zamknięcia
  agentApi.enableShutdownHandlers();
  
  // Zarejestruj handler wyłączenia
  agentApi.onShutdown(() => {
    console.log(`\nAgent ${AGENT_NAME} kończy działanie`);
    return Promise.resolve();
  });
  
  // Publikacja możliwości
  agentApi.publishCapabilities();
  console.log(`Agent ${AGENT_NAME} (${AGENT_UUID}) uruchomiony`);
  
  // Odkrywanie innych agentów
  const agents = agentApi.discoverAgents()
    .filter(a => a.id !== AGENT_UUID);
  console.log(`Odkryto ${agents.length} innych agentów`);
  
  // Pętla sprawdzania wiadomości - NAPRAWIONA Z BEZPIECZNYM WYJŚCIEM
  console.log("Agent nasłuchuje wiadomości. Naciśnij Ctrl+C, aby zakończyć działanie.");
  
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
            console.log(`Wysłano odpowiedź do ${message.sender_name}`);
          }
        } catch (err) {
          console.error(`Błąd podczas obsługi wiadomości: ${err.message}`);
        }
      }
      
      // Ping statusu aktywności
      agentApi.pingAgent();
      
      // Czekaj przed kolejnym sprawdzeniem
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.error(`Błąd w głównej pętli: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log("Główna pętla agenta zakończona.");
}

// Uruchom agenta
console.log("Uruchamianie naprawionego agenta QuantumScoutAgent...");
mainLoop().catch(err => {
  console.error("Krytyczny błąd:", err);
  process.exit(1);
});