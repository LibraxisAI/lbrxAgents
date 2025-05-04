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
const agentApi = require('../../src/agent-api');

// ====================================
// KONFIGURACJA AGENTA - EDYTUJ TUTAJ
// ====================================

// Generowanie UUID automatycznie zamiast używania hardkodowanego
const AGENT_UUID = require('crypto').randomUUID();

// Zastąp to swoimi danymi
const AGENT_NAME = "Demo";
const AGENT_DESCRIPTION = "Agent demonstracyjny";
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
// INICJALIZACJA AGENTA - NIE ZMIENIAJ
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