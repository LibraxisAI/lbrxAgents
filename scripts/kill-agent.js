/**
 * Script for killing a problematic agent
 * Skrypt do zatrzymania agenta powodującego problemy
 */

const fs = require('fs');
const path = require('path');
const agentApi = require('../src/agent-api');

// Ustawienia
const PROJECT_ROOT = process.cwd();
const BASE_PATH = path.join(PROJECT_ROOT, '.a2a');
const MESSAGES_PATH = path.join(BASE_PATH, 'messages');
const DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');

// Id agenta do zatrzymania
const AGENT_ID = process.argv[2];

if (!AGENT_ID) {
  console.error('Błąd: Nie podano ID agenta do zatrzymania.');
  console.error('Użycie: node kill-agent.js <agent-id>');
  process.exit(1);
}

// Funkcja do wysyłania wiadomości kontrolnej
function sendControlMessage(agentId) {
  console.log(`Wysyłanie wiadomości kontrolnej do agenta ${agentId}...`);
  
  // Upewnij się, że ścieżki istnieją
  if (!fs.existsSync(MESSAGES_PATH)) {
    fs.mkdirSync(MESSAGES_PATH, { recursive: true });
  }
  
  if (!fs.existsSync(path.join(MESSAGES_PATH, agentId))) {
    fs.mkdirSync(path.join(MESSAGES_PATH, agentId), { recursive: true });
  }
  
  // Tworzymy wiadomość bezpośrednio w katalogu agenta
  const messageId = Date.now().toString();
  const message = {
    message_id: messageId,
    sender_id: "SYSTEM",
    sender_name: "Protocol Cleanup",
    target_id: agentId,
    timestamp: new Date().toISOString(),
    message_type: "control",
    content: {
      text: "Natychmiastowe zakończenie pracy. Agent powoduje problemy w protokole.",
      control_command: "exit_loop",
      emergency: true,
      force: true
    }
  };
  
  // Zapisz w głównym katalogu wiadomości
  const messagePath = path.join(MESSAGES_PATH, `${messageId}.json`);
  fs.writeFileSync(messagePath, JSON.stringify(message, null, 2));
  
  // Zapisz w katalogu agenta
  const agentMessagePath = path.join(MESSAGES_PATH, agentId, `${messageId}.json`);
  fs.writeFileSync(agentMessagePath, JSON.stringify(message, null, 2));
  
  console.log('Wiadomość kontrolna wysłana pomyślnie.');
  
  // Spróbuj też usunąć tego agenta z discovery
  const discoveryPath = path.join(DISCOVERY_PATH, `${agentId}.json`);
  if (fs.existsSync(discoveryPath)) {
    try {
      fs.unlinkSync(discoveryPath);
      console.log(`Usunięto kartę agenta z discovery: ${agentId}`);
    } catch (e) {
      console.error(`Błąd podczas usuwania karty agenta: ${e.message}`);
    }
  }
  
  // Usuń wszystkie wiadomości tego agenta
  try {
    console.log('Usuwanie wszystkich wiadomości od tego agenta...');
    
    const files = fs.readdirSync(MESSAGES_PATH)
      .filter(f => f.endsWith('.json'))
      .map(f => path.join(MESSAGES_PATH, f));
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const message = JSON.parse(content);
        
        if (message.sender_id === agentId || message.target_id === agentId) {
          fs.unlinkSync(file);
        }
      } catch (e) {
        // Ignoruj błędne pliki
      }
    }
    
    // Usuń cały katalog wiadomości agenta
    const agentDir = path.join(MESSAGES_PATH, agentId);
    if (fs.existsSync(agentDir)) {
      const dirFiles = fs.readdirSync(agentDir);
      for (const file of dirFiles) {
        fs.unlinkSync(path.join(agentDir, file));
      }
      fs.rmdirSync(agentDir);
      console.log(`Usunięto katalog wiadomości agenta: ${agentId}`);
    }
    
  } catch (e) {
    console.error(`Błąd podczas czyszczenia wiadomości: ${e.message}`);
  }
  
  console.log('Zakończono czyszczenie protokołu po agencie.');
}

// Główna funkcja
function main() {
  console.log(`Próba zatrzymania agenta: ${AGENT_ID}`);
  sendControlMessage(AGENT_ID);
}

// Uruchom program
main();