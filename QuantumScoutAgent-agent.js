/**
 * QuantumScoutAgent
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('./agent-api');

// ====================================
// KONFIGURACJA AGENTA
// ====================================

const AGENT_UUID = "30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D"; 
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
      return {
        text: "Test otrzymany pomyślnie",
        status: "success",
        timestamp: new Date().toISOString()
      };
      
    case 'notification':
      console.log("Otrzymano powiadomienie");
      return null;
      
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
  const cardPath = path.join(__dirname, `${AGENT_NAME}Card.json`);
  const cardContent = {
    name: AGENT_NAME,
    version: "1.0.0",
    id: AGENT_UUID,
    description: AGENT_DESCRIPTION,
    capabilities: AGENT_CAPABILITIES,
    apis: {
      message_endpoint: "/tmp/quantum-scout/agents/messages/",
      discovery_endpoint: "/tmp/quantum-scout/agents/discovery/"
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
  createAgentCard();
  
  // Publikacja możliwości
  agentApi.publishCapabilities();
  console.log(`Agent ${AGENT_NAME} (${AGENT_UUID}) uruchomiony`);
  
  // Odkrywanie innych agentów
  const agents = agentApi.discoverAgents()
    .filter(a => a.id !== AGENT_UUID);
  console.log(`Odkryto ${agents.length} innych agentów`);
  
  // Pętla sprawdzania wiadomości
  while (true) {
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
}

// Uruchom agenta
mainLoop().catch(err => {
  console.error("Krytyczny błąd:", err);
  process.exit(1);
});