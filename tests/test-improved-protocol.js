/**
 * Test Protokołu A2A z nowymi funkcjami bezpieczeństwa
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('../src/agent-api');

// Konfiguracja agenta testowego
const AGENT_UUID = "574A8FCD-8FB4-4DEC-A26F-0B9ACFDA5A12"; // UUID testera protokołu
const AGENT_NAME = "ProtocolTesterAgent";
const AGENT_DESCRIPTION = "Agent testujący bezpieczeństwo protokołu A2A";

// Utworzenie karty agenta testowego
function setupTestAgent() {
  const cardPath = path.join(__dirname, `${AGENT_NAME}Card.json`);
  const cardContent = {
    name: AGENT_NAME,
    version: "1.0.0",
    id: AGENT_UUID,
    description: AGENT_DESCRIPTION,
    capabilities: ["protocol_testing", "security_validation"],
    apis: {
      message_endpoint: "/tmp/quantum-scout/agents/messages/",
      discovery_endpoint: "/tmp/quantum-scout/agents/discovery/"
    },
    author: "Claude",
    created_at: new Date().toISOString()
  };
  
  fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
  return cardPath;
}

// Test wysyłania wiadomości kontrolnej
async function testControlMessages() {
  console.log("Test 1: Wysyłanie wiadomości kontrolnej");
  
  // Znajdź wszystkich agentów w systemie
  const agents = agentApi.discoverAgents();
  if (agents.length === 0) {
    console.log("Nie znaleziono innych agentów do testowania");
    return false;
  }
  
  // Wybierz agenta testowego (innego niż my)
  const testAgent = agents.find(a => a.id !== AGENT_UUID);
  if (!testAgent) {
    console.log("Nie znaleziono innego agenta do testowania");
    return false;
  }
  
  console.log(`Wysyłanie wiadomości kontrolnej do: ${testAgent.name} (${testAgent.id})`);
  
  // Wyślij wiadomość kontrolną
  agentApi.sendMessage(testAgent.id, {
    text: "TEST: Prośba o potwierdzenie obsługi wiadomości kontrolnych",
    control_command: "test_control",
    test_id: "control_message_test"
  }, "control");
  
  console.log("Wiadomość kontrolna wysłana");
  
  // Poczekaj na odpowiedź przez 5 sekund
  console.log("Oczekiwanie na odpowiedź (5 sekund)...");
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Sprawdź odpowiedzi
  const responses = agentApi.receiveMessages();
  const testResponse = responses.find(msg => 
    msg.sender_id === testAgent.id && 
    msg.content && 
    msg.content.test_id === "control_message_test_response"
  );
  
  if (testResponse) {
    console.log("Test zakończony powodzeniem! Agent obsługuje wiadomości kontrolne.");
    console.log(`Odpowiedź: ${JSON.stringify(testResponse.content)}`);
    return true;
  } else {
    console.log("Test nie powiódł się. Agent nie odpowiedział na wiadomość kontrolną.");
    return false;
  }
}

// Test obsługi sygnałów zamknięcia
async function testShutdownHandling() {
  console.log("\nTest 2: Testowanie obsługi zakończenia procesu");
  
  // Włącz obsługę zamknięcia
  agentApi.enableShutdownHandlers();
  
  // Zarejestruj funkcję czyszczącą
  let cleanupCalled = false;
  agentApi.onShutdown(() => {
    cleanupCalled = true;
    console.log("Funkcja czyszcząca została wywołana!");
    return Promise.resolve();
  });
  
  // Zasymuluj żądanie zamknięcia
  console.log("Symulacja żądania zamknięcia...");
  agentApi.requestShutdown();
  
  // Sprawdź czy flaga została ustawiona
  const shutdownRequested = agentApi.isShutdownRequested();
  
  console.log(`Flaga żądania zamknięcia: ${shutdownRequested ? "USTAWIONA" : "NIE USTAWIONA"}`);
  console.log(`Funkcja czyszcząca wywołana: ${cleanupCalled ? "TAK" : "NIE"}`);
  
  if (shutdownRequested) {
    console.log("Test zakończony powodzeniem! Obsługa zakończenia procesu działa poprawnie.");
    return true;
  } else {
    console.log("Test nie powiódł się. Flaga zamknięcia nie została ustawiona.");
    return false;
  }
}

// Test wykrywania i przetwarzania wiadomości kontrolnych
async function testControlMessageProcessing() {
  console.log("\nTest 3: Testowanie przetwarzania wiadomości kontrolnych");
  
  // Przygotuj testową wiadomość kontrolną
  const testMessage = {
    message_id: "test-control-msg-" + Date.now(),
    sender_id: "test-sender",
    sender_name: "TestSender",
    target_id: AGENT_UUID,
    timestamp: new Date().toISOString(),
    message_type: "control",
    content: {
      text: "Test exit_loop command",
      control_command: "exit_loop"
    }
  };
  
  // Zapisz wiadomość do katalogu wiadomości
  const msgDir = path.join('/tmp/quantum-scout/agents/messages', AGENT_UUID);
  if (!fs.existsSync(msgDir)) fs.mkdirSync(msgDir, { recursive: true });
  
  const msgPath = path.join(msgDir, `${testMessage.message_id}.json`);
  fs.writeFileSync(msgPath, JSON.stringify(testMessage, null, 2));
  
  console.log("Wiadomość kontrolna zapisana w katalogu wiadomości");
  
  // Odczytaj wiadomości (nie oznaczaj jako przeczytane)
  const messages = agentApi.receiveMessages(false);
  
  // Sprawdź czy wiadomość kontrolna została wykryta
  const controlMsg = messages.find(msg => 
    msg.message_type === "control" && 
    msg.content && 
    msg.content.control_command === "exit_loop"
  );
  
  const shutdownRequested = agentApi.isShutdownRequested();
  
  console.log(`Wiadomość kontrolna wykryta: ${controlMsg ? "TAK" : "NIE"}`);
  console.log(`Żądanie zamknięcia ustawione: ${shutdownRequested ? "TAK" : "NIE"}`);
  
  // Posprzątaj po teście
  try {
    fs.unlinkSync(msgPath);
  } catch (e) {
    console.warn("Nie można usunąć testowej wiadomości", e);
  }
  
  if (controlMsg && shutdownRequested) {
    console.log("Test zakończony powodzeniem! Wykrywanie wiadomości kontrolnych działa poprawnie.");
    return true;
  } else {
    console.log("Test nie powiódł się. Wiadomość kontrolna nie została wykryta lub nie ustawiono flagi zamknięcia.");
    return false;
  }
}

// Funkcja główna testu
async function runTests() {
  console.log("=== TEST ULEPSZONYCH FUNKCJI PROTOKOŁU A2A ===");
  console.log(`Czas rozpoczęcia: ${new Date().toISOString()}`);
  console.log("-------------------------------------------");
  
  // Przygotuj agenta testowego
  setupTestAgent();
  
  // Opublikuj możliwości
  agentApi.publishCapabilities();
  console.log(`Agent testowy ${AGENT_NAME} (${AGENT_UUID}) uruchomiony`);
  
  // Uruchom testy
  let results = {
    testControlMessages: false,
    testShutdownHandling: false,
    testControlMessageProcessing: false
  };
  
  try {
    results.testControlMessages = await testControlMessages();
  } catch (error) {
    console.error("Błąd podczas testu wiadomości kontrolnych:", error);
  }
  
  try {
    results.testShutdownHandling = await testShutdownHandling();
  } catch (error) {
    console.error("Błąd podczas testu obsługi zamknięcia:", error);
  }
  
  try {
    results.testControlMessageProcessing = await testControlMessageProcessing();
  } catch (error) {
    console.error("Błąd podczas testu przetwarzania wiadomości kontrolnych:", error);
  }
  
  // Podsumowanie testów
  console.log("\n=== PODSUMOWANIE TESTÓW ===");
  console.log(`Test 1 (Wiadomości kontrolne): ${results.testControlMessages ? "SUKCES" : "NIEPOWODZENIE"}`);
  console.log(`Test 2 (Obsługa zamknięcia): ${results.testShutdownHandling ? "SUKCES" : "NIEPOWODZENIE"}`);
  console.log(`Test 3 (Przetwarzanie wiadomości kontrolnych): ${results.testControlMessageProcessing ? "SUKCES" : "NIEPOWODZENIE"}`);
  
  const successCount = Object.values(results).filter(Boolean).length;
  console.log(`\nWynik: ${successCount}/3 testów zakończonych powodzeniem`);
  
  if (successCount === 3) {
    console.log("\n✅ WSZYSTKIE TESTY ZAKOŃCZONE POWODZENIEM!");
    console.log("Protokół A2A został pomyślnie zaktualizowany z nowymi funkcjami bezpieczeństwa.");
  } else {
    console.log("\n⚠️ NIEKTÓRE TESTY NIE POWIODŁY SIĘ");
    console.log("Należy sprawdzić problemy i poprawić implementację protokołu.");
  }
  
  console.log("\nTest zakończony.");
}

// Uruchom testy
runTests().catch(err => {
  console.error("Krytyczny błąd podczas testów:", err);
});