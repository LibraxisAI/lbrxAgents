/**
 * Test Claude Protocol Agent
 * Test protokołu lbrxAgents
 */

const agentApi = require('../src/agent-api');
const fs = require('fs');
const path = require('path');

// Ścieżka do karty agenta
const cardPath = path.join(__dirname, '..', 'cards', 'ClaudeProtocolTesterCard.json');
console.log(`Ścieżka karty agenta: ${cardPath}`);

// Sprawdź czy karta agenta istnieje
if (!fs.existsSync(cardPath)) {
  console.error(`Karta agenta nie istnieje: ${cardPath}`);
  process.exit(1);
}

// Wczytaj kartę agenta
const myCard = JSON.parse(fs.readFileSync(cardPath, 'utf8'));
const myId = myCard.id;

console.log(`Agent: ${myCard.name} (${myId})`);
console.log(`Opis: ${myCard.description}`);
console.log(`Możliwości: ${myCard.capabilities.join(', ')}`);

// Ustaw ścieżkę karty agenta
agentApi.setAgentCardPath(cardPath);

// Włączenie obsługi zakończenia procesu
agentApi.enableShutdownHandlers();
console.log('Włączono obsługę zakończenia procesu');

// Publikacja możliwości
console.log('Publikowanie możliwości agenta...');
agentApi.publishCapabilities();

// Odkrywanie innych agentów
console.log('\nOdkrywanie innych agentów...');
const agents = agentApi.discoverAgents();
console.log(`Odkryto ${agents.length} agentów`);

for (const agent of agents) {
  console.log(`- ${agent.name} (${agent.id}): ${agent.description}`);
  console.log(`  Możliwości: ${agent.capabilities ? agent.capabilities.join(', ') : 'brak'}`);
  console.log(`  Status: ${agent.active ? 'aktywny' : 'nieaktywny'}`);
}

// Test podstawowej komunikacji
async function runBasicTest() {
  console.log('\nUruchamianie testu podstawowej komunikacji...');
  
  // Znajdź agenta do testów, który nie jest nami
  const otherAgents = agents.filter(a => a.id !== myId && a.active);
  
  if (otherAgents.length === 0) {
    console.log('Brak aktywnych agentów do testu komunikacji');
    return;
  }
  
  // Wybierz losowego agenta do testu
  const targetIndex = Math.floor(Math.random() * otherAgents.length);
  const targetAgent = otherAgents[targetIndex];
  
  console.log(`Wybrany agent do testu: ${targetAgent.name} (${targetAgent.id})`);
  
  // Wyślij testową wiadomość
  const testId = Date.now().toString();
  const testMessage = {
    text: "Testowa wiadomość protokołu lbrxAgents",
    test_id: testId,
    timestamp: new Date().toISOString(),
    test_type: "basic_protocol_test",
    sender_info: {
      name: myCard.name,
      id: myId
    }
  };
  
  console.log(`Wysyłanie testowej wiadomości z ID: ${testId}`);
  const sent = agentApi.sendMessage(targetAgent.id, testMessage, "test");
  
  if (sent) {
    console.log('Wiadomość wysłana pomyślnie');
  } else {
    console.error('Błąd wysyłania wiadomości');
    return;
  }
  
  // Czekaj na odpowiedź (max 10 sekund)
  console.log('Oczekiwanie na odpowiedź...');
  let responseReceived = false;
  
  for (let i = 0; i < 10; i++) {
    // Czekaj 1 sekundę
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Sprawdzanie odpowiedzi (${i+1}/10)...`);
    
    // Sprawdź odpowiedzi
    const messages = agentApi.receiveMessages(false);
    const responses = messages.filter(msg => msg.sender_id === targetAgent.id);
    
    if (responses.length > 0) {
      console.log(`Otrzymano ${responses.length} odpowiedzi od ${targetAgent.name}`);
      
      for (const response of responses) {
        console.log(`- Typ: ${response.message_type}`);
        console.log(`- Treść: ${JSON.stringify(response.content)}`);
        
        // Sprawdź czy to odpowiedź na naszą wiadomość testową
        if (response.content && response.content.test_received) {
          console.log('TEST SUKCES: Otrzymano potwierdzenie testu');
          responseReceived = true;
        }
      }
      
      // Jeśli otrzymano odpowiedź, zakończ czekanie
      if (responseReceived) break;
    }
  }
  
  if (!responseReceived) {
    console.log('TEST NIEPOWODZENIE: Nie otrzymano odpowiedzi na wiadomość testową');
  }
}

// Test mechanizmu zakończenia
async function testShutdownMechanism() {
  console.log('\nTest mechanizmu zakończenia:');
  
  // Sprawdź, czy mechanizm zamknięcia jest włączony
  const isRequestedBefore = agentApi.isShutdownRequested();
  console.log(`- Stan przed testem: ${isRequestedBefore ? 'zakończenie zażądane' : 'normalne działanie'}`);
  
  // Zażądaj zakończenia
  console.log('- Żądanie zakończenia...');
  agentApi.requestShutdown();
  
  // Sprawdź, czy stan się zmienił
  const isRequestedAfter = agentApi.isShutdownRequested();
  console.log(`- Stan po teście: ${isRequestedAfter ? 'zakończenie zażądane' : 'normalne działanie'}`);
  
  if (isRequestedAfter) {
    console.log('TEST SUKCES: Mechanizm zamknięcia działa poprawnie');
  } else {
    console.log('TEST NIEPOWODZENIE: Mechanizm zamknięcia nie działa');
  }
}

// Uruchom testy
async function runTests() {
  try {
    await runBasicTest();
    await testShutdownMechanism();
    
    console.log('\nTesty zakończone');
    process.exit(0);
  } catch (error) {
    console.error('Błąd podczas testów:', error);
    process.exit(1);
  }
}

// Uruchom testy
runTests();