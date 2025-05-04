/**
 * Skrypt do wstrzykiwania wiadomości między agentami
 * 
 * Przykład użycia:
 * node inject.js <target-agent-id> <plik-z-instrukcjami>
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('../src/agent-api');

// Sprawdź argumenty
if (process.argv.length < 4) {
  console.log('Użycie: node inject.js <target-agent-id> <plik-z-instrukcjami>');
  process.exit(1);
}

const targetAgentId = process.argv[2];
const instructionsFile = process.argv[3];

// Sprawdź, czy agent docelowy istnieje
const agents = agentApi.discoverAgents();
const targetAgent = agents.find(a => a.id === targetAgentId);

if (!targetAgent) {
  console.error(`Agent o ID ${targetAgentId} nie istnieje!`);
  console.log('Dostępni agenci:');
  agents.forEach(a => console.log(`- ${a.name} (${a.id})`));
  process.exit(1);
}

// Odczytaj plik z instrukcjami
try {
  const instructionsContent = fs.readFileSync(instructionsFile, 'utf8');
  
  // Przygotuj wiadomość
  const messageContent = {
    text: "Instrukcje od użytkownika",
    instructions: instructionsContent,
    inject: true,
    timestamp: new Date().toISOString(),
    priority: "high"
  };
  
  // Wyślij wiadomość
  console.log(`Wysyłanie instrukcji do agenta ${targetAgent.name}...`);
  const result = agentApi.sendMessage(targetAgentId, messageContent, "action");
  
  if (result) {
    console.log(`Instrukcje wysłane pomyślnie do ${targetAgent.name} (${targetAgentId})`);
    
    // Loguj aktywność
    agentApi.logAgentActivity('inject_instructions', {
      target: targetAgentId,
      file: instructionsFile,
      timestamp: new Date().toISOString()
    });
  } else {
    console.error('Błąd podczas wysyłania instrukcji!');
  }
} catch (error) {
  console.error(`Błąd: ${error.message}`);
  process.exit(1);
}