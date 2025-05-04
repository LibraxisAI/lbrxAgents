/**
 * ClaudeProtocolTester Agent
 * 
 * Agent do testowania protokołu lbrxAgents w warunkach rzeczywistych
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('./src/agent-api');

// ====================================
// KONFIGURACJA AGENTA
// ====================================

const AGENT_UUID = "02BB5835-45ED-4E34-A986-44CD535957EC"; 
const AGENT_NAME = "ClaudeProtocolTester";
const AGENT_DESCRIPTION = "Agent Claude do testowania protokołu lbrxAgents w warunkach rzeczywistych";
const AGENT_CAPABILITIES = [
  "protocol_testing",
  "message_handling",
  "error_detection",
  "performance_analysis",
  "security_validation"
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
  console.log(`[${AGENT_NAME}] Otrzymano wiadomość od: ${message.sender_name}`);
  console.log(`[${AGENT_NAME}] Typ: ${message.message_type}`);
  console.log(`[${AGENT_NAME}] Treść: ${JSON.stringify(message.content)}`);
  
  switch (message.message_type) {
    case 'query':
      return {
        text: "Dziękuję za zapytanie. Jestem agentem Claude testującym protokół lbrxAgents.",
        test_results: {
          protocol_version: "1.0.0",
          connectivity: "success",
          latency_ms: Math.floor(Math.random() * 50) + 10,
          request_id: message.message_id,
          timestamp: new Date().toISOString()
        }
      };
      
    case 'action':
      console.log(`[${AGENT_NAME}] Żądana akcja: ${message.content.action || 'unknown'}`);
      // Symulacja wykonania akcji testowej
      await delay(500);  // Symulacja działania
      return {
        text: "Akcja testowa wykonana",
        result: {
          status: "success",
          action_id: message.message_id,
          timestamp: new Date().toISOString(),
          details: "Test protokołu wykonany pomyślnie",
          protocol_metrics: {
            message_round_trip_ms: Math.floor(Math.random() * 100) + 50,
            bandwidth_usage: `${Math.floor(Math.random() * 100) + 20}KB`,
            error_rate: 0.0
          }
        }
      };
      
    case 'notification':
      console.log(`[${AGENT_NAME}] Otrzymano powiadomienie`);
      return null;
      
    case 'announcement':
      // Odpowiedź na ogłoszenie jeśli jest to nowy agent
      if (message.content && message.content.agent_details) {
        const { id, name } = message.content.agent_details;
        console.log(`[${AGENT_NAME}] Rozpoznano nowego agenta: ${name} (${id})`);
        
        // Wysłanie powitalnej wiadomości do nowego agenta
        agentApi.sendMessage(id, {
          text: `Witaj ${name}! Jestem ${AGENT_NAME}, agent testujący protokół.`,
          welcome: true,
          test_greeting: "Protocol test initiated",
          timestamp: new Date().toISOString()
        }, "notification");
        
        return {
          text: "Powiadomienie o nowym agencie przyjęte",
          status: "acknowledged",
          timestamp: new Date().toISOString()
        };
      }
      return null;
      
    default:
      console.log(`[${AGENT_NAME}] Nieobsługiwany typ wiadomości: ${message.message_type}`);
      return null;
  }
}

// Funkcja opóźniająca
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ====================================
// INICJALIZACJA AGENTA
// ====================================

// Utworzenie karty agenta
function createAgentCard() {
  const cardPath = path.join(__dirname, 'cards', `${AGENT_NAME}Card.json`);
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
    author: "Claude",
    created_at: new Date().toISOString()
  };
  
  fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
  return cardPath;
}

// Główna pętla
async function mainLoop() {
  try {
    // Tworzenie karty agenta
    createAgentCard();
    
    // Publikacja możliwości
    agentApi.publishCapabilities();
    console.log(`[${AGENT_NAME}] Agent ${AGENT_NAME} (${AGENT_UUID}) uruchomiony`);
    
    // Odkrywanie innych agentów
    const agents = agentApi.discoverAgents()
      .filter(a => a.id !== AGENT_UUID);
    console.log(`[${AGENT_NAME}] Odkryto ${agents.length} innych agentów`);
    
    // Powiadom istniejących agentów o dołączeniu
    agents.forEach(agent => {
      agentApi.sendMessage(agent.id, {
        text: `${AGENT_NAME} dołączył do systemu i jest gotowy do testowania protokołu.`,
        greeting: true,
        protocol_version: "1.0.0",
        timestamp: new Date().toISOString()
      }, "notification");
    });
    
    // Pętla sprawdzania wiadomości - z limitem czasu
    let runtime = 0;
    const MAX_RUNTIME = 60000; // 60 sekund
    const CHECK_INTERVAL = 3000; // 3 sekundy
    
    while (runtime < MAX_RUNTIME) {
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
              console.log(`[${AGENT_NAME}] Wysłano odpowiedź do ${message.sender_name}`);
            }
          } catch (err) {
            console.error(`[${AGENT_NAME}] Błąd podczas obsługi wiadomości: ${err.message}`);
          }
        }
        
        // Czekaj przed kolejnym sprawdzeniem
        await delay(CHECK_INTERVAL);
        runtime += CHECK_INTERVAL;
        
        // Pokaż aktualny stan
        const progress = Math.floor((runtime / MAX_RUNTIME) * 100);
        console.log(`[${AGENT_NAME}] Test w toku: ${progress}% (${runtime}ms / ${MAX_RUNTIME}ms)`);
        
      } catch (error) {
        console.error(`[${AGENT_NAME}] Błąd w głównej pętli: ${error.message}`);
        await delay(5000);
        runtime += 5000;
      }
    }
    
    // Końcowe raportowanie i zamknięcie
    console.log(`[${AGENT_NAME}] Test protokołu zakończony po ${MAX_RUNTIME}ms`);
    const finalAgents = agentApi.discoverAgents();
    console.log(`[${AGENT_NAME}] Podsumowanie: wykryto ${finalAgents.length} agentów w systemie`);
    
    // Wyrejestruj agenta przy zakończeniu
    agentApi.deregisterAgent(AGENT_UUID);
    console.log(`[${AGENT_NAME}] Agent wyrejestrowany z systemu`);
  } catch (err) {
    console.error(`[${AGENT_NAME}] Krytyczny błąd: ${err.message}`);
    process.exit(1);
  }
}

// Uruchom agenta
mainLoop().catch(err => {
  console.error(`[${AGENT_NAME}] Krytyczny błąd:`, err);
  process.exit(1);
});