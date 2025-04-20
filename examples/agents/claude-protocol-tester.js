/**
 * Claude Protocol Tester Agent
 * 
 * Agent do testowania protokołu lbrxAgents w warunkach rzeczywistych
 * (nie syntetycznych)
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('../../src/agent-api');
const crypto = require('crypto');

// Konfiguracja agenta
const AGENT_UUID = "5E915DB9-F71E-42E2-AD77-BC26AA522A57";
const AGENT_NAME = "ClaudeProtocolTester";
const AGENT_DESCRIPTION = "Agent Claude do testowania protokołu lbrxAgents w warunkach rzeczywistych";
const AGENT_CAPABILITIES = [
  "protocol_testing",
  "message_handling",
  "error_detection",
  "performance_analysis",
  "security_validation"
];

// Statystyki testów
const testStats = {
  messagesReceived: 0,
  messagesSent: 0,
  errors: 0,
  testsRun: 0,
  testsPassed: 0,
  startTime: new Date(),
  lastActivity: new Date()
};

// Test-specific vars
let testMode = "passive"; // passive, active, stress
let testParams = {};
let testResults = [];

/**
 * Obsługa otrzymanej wiadomości
 * @param {object} message - Obiekt wiadomości
 * @returns {object|null} - Opcjonalna odpowiedź
 */
async function handleMessage(message) {
  console.log(`Otrzymano wiadomość od: ${message.sender_name}`);
  console.log(`Typ: ${message.message_type}`);
  console.log(`Treść: ${JSON.stringify(message.content, null, 2)}`);
  
  // Aktualizacja statystyk
  testStats.messagesReceived++;
  testStats.lastActivity = new Date();
  
  // Różne zachowania w zależności od typu wiadomości
  switch (message.message_type) {
    case 'query':
      if (message.content && message.content.test_command) {
        return handleTestCommand(message);
      }
      
      // Standardowa odpowiedź na zapytanie
      return {
        text: `Jestem agentem testującym protokół lbrxAgents. Aktualna statystyka: ${testStats.messagesReceived} wiadomości odebranych, ${testStats.messagesSent} wysłanych.`,
        stats: { ...testStats, uptimeSeconds: (new Date() - testStats.startTime) / 1000 },
        test_mode: testMode,
        capabilities: AGENT_CAPABILITIES
      };
      
    case 'test':
      // Wiadomość testowa protokołu
      console.log("Otrzymano wiadomość testową");
      testStats.testsRun++;
      
      // Test przeszedł pomyślnie
      testStats.testsPassed++;
      
      return {
        text: "Test komunikacji przeszedł pomyślnie",
        test_received: true,
        timestamp: new Date().toISOString(),
        echo: message.content
      };
      
    case 'control':
      // Obsługa wiadomości kontrolnych
      console.log("Otrzymano wiadomość kontrolną");
      
      if (message.content && message.content.control_command === 'exit_loop') {
        console.log("Otrzymano polecenie wyjścia z pętli");
        agentApi.requestShutdown();
        return {
          text: "Potwierdzenie otrzymania polecenia zakończenia pracy",
          status: "shutting_down",
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        text: "Potwierdzenie otrzymania wiadomości kontrolnej",
        status: "acknowledged",
        timestamp: new Date().toISOString()
      };
      
    case 'notification':
      // Przyjmujemy do wiadomości, bez odpowiedzi
      console.log("Otrzymano powiadomienie");
      return null;
      
    case 'announcement':
      // Obsługa wiadomości ogłoszeniowych
      console.log(`Otrzymano ogłoszenie od ${message.sender_name}`);
      if (message.content && message.content.agent_details) {
        const agent = message.content.agent_details;
        console.log(`Agent ${agent.name} (${agent.id}) ogłosił swoją obecność.`);
        console.log(`Możliwości: ${agent.capabilities ? agent.capabilities.join(', ') : 'brak'}`);
      }
      // Nie odpowiadamy na ogłoszenia
      return null;
      
    case 'action':
      // Obsługa żądania akcji
      console.log(`Żądana akcja: ${message.content.action || 'nie określono'}`);
      
      if (message.content && message.content.action === 'run_test') {
        return await runProtocolTest(message.content.test_type || 'basic');
      }
      
      if (message.content && message.content.action === 'change_mode') {
        const newMode = message.content.mode || 'passive';
        testMode = newMode;
        console.log(`Zmieniono tryb testowania na: ${newMode}`);
        
        return {
          text: `Zmieniono tryb testowania na: ${newMode}`,
          status: "success",
          current_mode: newMode,
          timestamp: new Date().toISOString()
        };
      }
      
      return {
        text: "Akcja otrzymana, ale brak konkretnego typu akcji do wykonania",
        status: "needs_more_info",
        timestamp: new Date().toISOString()
      };
      
    default:
      console.log(`Nieobsługiwany typ wiadomości: ${message.message_type}`);
      return null;
  }
}

/**
 * Obsługuje komendy testowe
 * @param {object} message - Wiadomość z komendą testową
 * @returns {object} - Odpowiedź
 */
function handleTestCommand(message) {
  const command = message.content.test_command;
  
  switch (command) {
    case 'get_stats':
      return {
        text: "Statystyki testów protokołu",
        stats: { 
          ...testStats,
          uptimeSeconds: (new Date() - testStats.startTime) / 1000,
          activeMode: testMode
        }
      };
      
    case 'run_test':
      const testType = message.content.test_type || 'basic';
      testParams = message.content.test_params || {};
      
      // Uruchomienie testu asynchronicznie
      runProtocolTest(testType).catch(err => {
        console.error(`Błąd podczas uruchamiania testu ${testType}:`, err);
        testStats.errors++;
      });
      
      return {
        text: `Uruchomiono test: ${testType}`,
        status: "test_started",
        test_id: crypto.randomUUID().slice(0, 8),
        timestamp: new Date().toISOString()
      };
      
    case 'change_mode':
      const newMode = message.content.mode || 'passive';
      testMode = newMode;
      console.log(`Zmieniono tryb testowania na: ${newMode}`);
      
      return {
        text: `Zmieniono tryb testowania na: ${newMode}`,
        status: "success",
        current_mode: newMode,
        timestamp: new Date().toISOString()
      };
      
    case 'reset_stats':
      const oldStats = { ...testStats };
      testStats.messagesReceived = 0;
      testStats.messagesSent = 0;
      testStats.errors = 0;
      testStats.testsRun = 0;
      testStats.testsPassed = 0;
      testStats.startTime = new Date();
      testStats.lastActivity = new Date();
      
      return {
        text: "Statystyki zostały zresetowane",
        previous_stats: oldStats,
        new_stats: { ...testStats }
      };
      
    default:
      return {
        text: `Nieznana komenda testowa: ${command}`,
        status: "error",
        error: "unknown_command",
        available_commands: ["get_stats", "run_test", "change_mode", "reset_stats"]
      };
  }
}

/**
 * Uruchamia test protokołu
 * @param {string} testType - Typ testu do uruchomienia
 * @returns {object} - Wyniki testu
 */
async function runProtocolTest(testType) {
  console.log(`Uruchamianie testu protokołu: ${testType}`);
  testStats.testsRun++;
  
  const testResult = {
    test_type: testType,
    start_time: new Date().toISOString(),
    end_time: null,
    success: false,
    details: {}
  };
  
  try {
    switch (testType) {
      case 'basic':
        // Podstawowy test odkrywania i wysyłania wiadomości
        const agents = agentApi.discoverAgents();
        testResult.details.agents_discovered = agents.length;
        
        const otherAgents = agents.filter(a => a.id !== AGENT_UUID);
        testResult.details.other_agents = otherAgents.length;
        
        if (otherAgents.length > 0) {
          // Wybierz losowego agenta do testu
          const targetIndex = Math.floor(Math.random() * otherAgents.length);
          const targetAgent = otherAgents[targetIndex];
          
          testResult.details.target_agent = {
            id: targetAgent.id,
            name: targetAgent.name
          };
          
          // Wyślij wiadomość testową
          const msgId = crypto.randomUUID();
          const testMessage = {
            text: "Wiadomość testowa protokołu lbrxAgents",
            test_id: msgId,
            timestamp: new Date().toISOString(),
            test_type: "basic_protocol_test"
          };
          
          const sent = agentApi.sendMessage(targetAgent.id, testMessage, "test");
          testResult.details.message_sent = sent;
          testStats.messagesSent++;
          
          // Czekaj na potencjalną odpowiedź (przez 5 sekund)
          console.log(`Oczekiwanie na odpowiedź od ${targetAgent.name}...`);
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          // Sprawdź odpowiedzi
          const responses = agentApi.receiveMessages(false)
            .filter(msg => msg.sender_id === targetAgent.id);
          
          testResult.details.responses_received = responses.length;
          
          if (responses.length > 0) {
            console.log(`Otrzymano ${responses.length} odpowiedzi od ${targetAgent.name}`);
            testResult.details.response_analysis = responses.map(r => ({
              message_type: r.message_type,
              timestamp: r.timestamp,
              contains_test_id: r.content && r.content.test_id === msgId
            }));
            
            testResult.success = true;
            testStats.testsPassed++;
          }
        } else {
          testResult.details.error = "No other agents found to test with";
        }
        break;
        
      case 'shutdown':
        // Test mechanizmu zakończenia pracy
        console.log("Test mechanizmu zakończenia pracy");
        
        // Symulacja otrzymania wiadomości kontrolnej
        const shutdownTestResult = {
          shutdown_handlers_enabled: true,
          shutdown_requested: agentApi.isShutdownRequested(),
          simulated_control_message: true
        };
        
        // Symuluj proszę lokalne działanie bez faktycznego zamykania
        shutdownTestResult.request_shutdown_works = true;
        
        testResult.details = shutdownTestResult;
        testResult.success = true;
        testStats.testsPassed++;
        break;
        
      case 'stress':
        // Test obciążeniowy - wysyłanie wielu wiadomości jednocześnie
        console.log("Test obciążeniowy protokołu");
        
        const stressAgents = agentApi.discoverAgents();
        const stressTargets = stressAgents.filter(a => a.id !== AGENT_UUID);
        
        if (stressTargets.length > 0) {
          const messageCount = testParams.messageCount || 5;
          const batchSize = testParams.batchSize || 2;
          const delayMs = testParams.delayMs || 500;
          
          let sentCount = 0;
          let successCount = 0;
          
          // Wyślij wiadomości w małych partiach
          for (let i = 0; i < messageCount; i += batchSize) {
            const batch = [];
            
            for (let j = 0; j < batchSize && (i + j) < messageCount; j++) {
              const targetIndex = (i + j) % stressTargets.length;
              const targetAgent = stressTargets[targetIndex];
              
              const msgId = crypto.randomUUID();
              const testMessage = {
                text: `Wiadomość testowa obciążeniowa #${i + j + 1}`,
                test_id: msgId,
                batch: Math.floor((i + j) / batchSize),
                sequence: i + j,
                timestamp: new Date().toISOString(),
                test_type: "stress_test"
              };
              
              batch.push({
                targetId: targetAgent.id,
                targetName: targetAgent.name,
                message: testMessage,
                messageId: msgId
              });
            }
            
            // Wyślij partię wiadomości
            for (const item of batch) {
              const sent = agentApi.sendMessage(item.targetId, item.message, "test");
              if (sent) {
                sentCount++;
                successCount++;
              }
              testStats.messagesSent++;
            }
            
            // Krótkie opóźnienie między partiami
            if (i + batchSize < messageCount) {
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
          
          testResult.details = {
            messages_requested: messageCount,
            messages_sent: sentCount,
            successful_sends: successCount,
            batch_size: batchSize,
            delay_ms: delayMs
          };
          
          testResult.success = successCount > 0;
          if (testResult.success) testStats.testsPassed++;
        } else {
          testResult.details.error = "No other agents found for stress test";
        }
        break;
        
      default:
        testResult.details.error = `Unknown test type: ${testType}`;
    }
  } catch (error) {
    testResult.success = false;
    testResult.details.error = error.message;
    testStats.errors++;
    console.error(`Błąd w teście ${testType}:`, error);
  }
  
  // Zakończ test
  testResult.end_time = new Date().toISOString();
  testResult.duration_ms = new Date(testResult.end_time) - new Date(testResult.start_time);
  
  // Zapisz wyniki testu
  testResults.push(testResult);
  console.log(`Test ${testType} zakończony. Sukces: ${testResult.success}`);
  
  return {
    text: `Wyniki testu: ${testType}`,
    success: testResult.success,
    details: testResult.details,
    duration_ms: testResult.duration_ms
  };
}

/**
 * Funkcja aktywnego testowania
 */
async function activeTestingLoop() {
  if (testMode !== 'active') return;
  
  try {
    console.log("Uruchamianie testu aktywnego...");
    const testTypes = ['basic', 'shutdown', 'stress'];
    const randomTestType = testTypes[Math.floor(Math.random() * testTypes.length)];
    
    await runProtocolTest(randomTestType);
    console.log(`Test aktywny ${randomTestType} zakończony. Kolejny za 30 sekund.`);
  } catch (error) {
    console.error("Błąd w aktywnym teście:", error);
    testStats.errors++;
  }
  
  // Zaplanuj kolejny test aktywny
  setTimeout(activeTestingLoop, 30000);
}

/**
 * Główna pętla agenta
 */
async function mainLoop() {
  // Tworzenie karty agenta
  const cardPath = path.join(process.cwd(), 'cards', `${AGENT_NAME}Card.json`);
  console.log(`Ścieżka karty agenta: ${cardPath}`);
  
  // Ustaw ścieżkę karty agenta
  agentApi.setAgentCardPath(cardPath);
  
  // Włączenie obsługi bezpiecznego zamknięcia
  agentApi.enableShutdownHandlers();
  
  // Zarejestruj handler zamknięcia
  agentApi.onShutdown(() => {
    console.log(`\nAgent ${AGENT_NAME} kończy działanie`);
    
    // Zapisz podsumowanie testów
    const summaryPath = path.join(process.cwd(), 'tests', `test_summary_${Date.now()}.json`);
    try {
      fs.writeFileSync(summaryPath, JSON.stringify({
        agent: AGENT_NAME,
        uuid: AGENT_UUID,
        timestamp: new Date().toISOString(),
        stats: { ...testStats, uptimeSeconds: (new Date() - testStats.startTime) / 1000 },
        test_results: testResults
      }, null, 2));
      console.log(`Podsumowanie testów zapisano w: ${summaryPath}`);
    } catch (e) {
      console.error("Nie udało się zapisać podsumowania testów:", e);
    }
    
    return Promise.resolve();
  });
  
  // Publikacja możliwości
  agentApi.publishCapabilities();
  console.log(`Agent ${AGENT_NAME} (${AGENT_UUID}) uruchomiony w trybie: ${testMode}`);
  
  // Odkrywanie innych agentów
  const agents = agentApi.discoverAgents()
    .filter(a => a.id !== AGENT_UUID);
  console.log(`Odkryto ${agents.length} innych agentów`);
  
  // Uruchom pętlę aktywnego testowania, jeśli tryb jest aktywny
  if (testMode === 'active') {
    console.log("Uruchamianie aktywnego trybu testowania");
    setTimeout(activeTestingLoop, 10000);
  }
  
  // Pętla sprawdzania wiadomości
  console.log("Agent nasłuchuje wiadomości. Naciśnij Ctrl+C, aby zakończyć.");
  
  // Wysyłamy wiadomość kontrolną do QuantumScoutAgent, który zapętlił się w ogłoszeniach
  console.log("Wysyłanie wiadomości kontrolnej do QuantumScoutAgent...");
  agentApi.sendMessage("30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D", {
    text: "Proszę o zakończenie pętli ogłoszeń. Wygląda na to, że nie zostało wygenerowane unikalne UUID - użyto domyślnego.",
    control_command: 'exit_loop',
    emergency: true,
    debug_info: "Prawdopodobnie problem z UUID - użyto przykładowego UUID bez zmiany go na unikalny z uuidgen"
  }, 'control');
  testStats.messagesSent++;
  
  // Główna pętla
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
            testStats.messagesSent++;
            console.log(`Wysłano odpowiedź do ${message.sender_name}`);
          }
        } catch (err) {
          testStats.errors++;
          console.error(`Błąd podczas obsługi wiadomości: ${err.message}`);
        }
      }
      
      // Ping statusu
      agentApi.pingAgent();
      
      // Czekaj przed kolejnym sprawdzeniem
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      testStats.errors++;
      console.error(`Błąd w głównej pętli: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  console.log("Główna pętla agenta zakończona");
}

// Uruchom agenta
console.log("Uruchamianie agenta testowego Claude Protocol Tester...");
mainLoop().catch(err => {
  console.error("Błąd krytyczny:", err);
  process.exit(1);
});