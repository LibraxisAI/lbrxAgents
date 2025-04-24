/**
 * A2A Protocol Feedback Message
 * 
 * Wysyła wiadomość z informacją zwrotną na temat protokołu lbrxAgents
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('./src/agent-api');

// ID i nazwa agenta do którego wysyłamy
const RECIPIENT_ID = "30D8C3EB-D0D2-4AA0-B911-D60F866E1E2D"; // QuantumScoutAgent
const RECIPIENT_NAME = "QuantumScoutAgent";

// Ustawienie base path
const BASE_PATH = path.join(process.cwd(), '.a2a');
agentApi.setBasePath(BASE_PATH);

// Zamiast hardkodować MY_ID, generuj go na podstawie uuidgen (identyfikator sesji terminala)
const { execSync } = require('child_process');
function getSessionUUID() {
  try {
    return execSync('uuidgen').toString().trim();
  } catch (e) {
    return require('crypto').randomUUID();
  }
}
const MY_ID = getSessionUUID();
const MY_NAME = "ClaudeProtocolTester";

// Treść wiadomości
const feedbackMessage = {
  message_type: "feedback",
  title: "Feedback nt. protokołu lbrxAgents - Claude",
  sender: "Claude via MCP",
  timestamp: new Date().toISOString(),
  protocol_version: "1.0.0",
  test_results: {
    status: "success",
    issues_found: [
      "Problem z wykrywaniem agentów - początkowo agenci nie byli prawidłowo odnajdywani z powodu różnych ścieżek bazowych",
      "Kwestia bezpieczeństwa - używanie stałych UUID w przykładach zamiast dynamicznego generowania",
      "Nieskończone pętle w przykładach - brak mechanizmu zatrzymującego proces i zarządzającego cyklem życia agenta",
      "Brak obsługi ścieżek względnych w niektórych scenariuszach - używanie __dirname zamiast process.cwd()"
    ],
    recommendations: [
      "Zawsze używać agentApi.setBasePath() do jawnego ustawiania bazowej ścieżki protokołu",
      "Używać crypto.randomUUID() lub uuidgen w nowych agentach",
      "Implementować mechanizm limitu czasu działania agenta",
      "Unifikacja ścieżek dostępu do katalogów",
      "Zaktualizować dokumentację o znalezione problemy i rozwiązania"
    ],
    successful_tests: [
      "Odkrywanie agentów",
      "Publikowanie możliwości",
      "Wysyłanie wiadomości",
      "Odbieranie wiadomości",
      "Odpowiadanie na wiadomości",
      "Wyrejestrowywanie agenta z systemu"
    ]
  },
  conclusion: "Protokół A2A działa poprawnie i jest gotowy do użycia. Stworzyliśmy agenta testowego, który nawiązał komunikację z innymi agentami w systemie."
};

console.log(`Wysyłanie feedbacku do ${RECIPIENT_NAME} (${RECIPIENT_ID})...`);

// Przygotowanie karty agenta
function createAgentCard() {
  const cardPath = path.join(__dirname, 'cards', `${MY_NAME}Card.json`);
  const cardContent = {
    name: MY_NAME,
    version: "1.0.0",
    id: MY_ID,
    description: "Agent Claude do testowania protokołu lbrxAgents w warunkach rzeczywistych",
    capabilities: ["protocol_testing", "message_handling", "error_detection", "performance_analysis", "security_validation"],
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

// Publikacja karty agenta
createAgentCard();
agentApi.publishCapabilities();

// Wysłanie wiadomości
const result = agentApi.sendMessage(
  RECIPIENT_ID,
  feedbackMessage,
  "feedback"
);

if (result) {
  console.log("Wiadomość wysłana pomyślnie!");
} else {
  console.error("Błąd podczas wysyłania wiadomości!");
}

// Czekamy 2 sekundy na zakończenie operacji
setTimeout(() => {
  console.log("Operacja zakończona.");
}, 2000);