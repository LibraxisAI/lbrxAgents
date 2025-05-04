/**
 * Script for cleaning up protocol agents and directories
 * Skrypt do czyszczenia agentów protokołu i katalogów komunikacyjnych
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Ścieżki protokołu
const PROJECT_ROOT = process.cwd();
const BASE_PATH = path.join(PROJECT_ROOT, '.a2a');
const DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
const MESSAGES_PATH = path.join(BASE_PATH, 'messages');
const STATUS_PATH = path.join(BASE_PATH, 'status');
const CARDS_PATH = path.join(PROJECT_ROOT, 'cards');

// Funkcja sprawdzająca aktywność agenta
function isAgentActive(agentInfo, statusData) {
  if (!agentInfo || !statusData || !statusData.active_agents) {
    return false;
  }
  
  const agentStatus = statusData.active_agents[agentInfo.id];
  
  if (!agentStatus || agentStatus.status !== 'active') {
    return false;
  }
  
  // Sprawdź, czy ostatnia aktualizacja była niedawno (15 minut)
  const lastUpdate = new Date(agentStatus.last_update);
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  return lastUpdate > fifteenMinutesAgo;
}

// Funkcja oczyszczająca wiadomości
function cleanupMessages() {
  console.log('Czyszczenie wiadomości...');
  
  if (!fs.existsSync(MESSAGES_PATH)) {
    console.log('Katalog wiadomości nie istnieje.');
    return;
  }
  
  let deletedCount = 0;
  let keptCount = 0;
  
  // Usuń stare pliki wiadomości (starsze niż 30 minut)
  const thirtyMinutesAgo = Date.now() - 30 * 60 * 1000;
  
  const files = fs.readdirSync(MESSAGES_PATH)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(MESSAGES_PATH, f));
    
  for (const file of files) {
    try {
      const stats = fs.statSync(file);
      
      if (stats.isFile() && stats.mtimeMs < thirtyMinutesAgo) {
        fs.unlinkSync(file);
        deletedCount++;
      } else {
        keptCount++;
      }
    } catch (e) {
      console.error(`Błąd podczas przetwarzania pliku ${file}:`, e.message);
    }
  }
  
  // Usuń puste podkatalogi
  const subdirs = fs.readdirSync(MESSAGES_PATH)
    .filter(d => {
      const dirPath = path.join(MESSAGES_PATH, d);
      return fs.statSync(dirPath).isDirectory() && d !== 'read';
    })
    .map(d => path.join(MESSAGES_PATH, d));
  
  for (const dir of subdirs) {
    try {
      const files = fs.readdirSync(dir);
      
      if (files.length === 0) {
        fs.rmdirSync(dir);
        console.log(`Usunięto pusty katalog: ${dir}`);
      } else {
        // Usuń stare wiadomości w podkatalogu
        let subdirDeletedCount = 0;
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          
          if (stats.isFile() && stats.mtimeMs < thirtyMinutesAgo) {
            fs.unlinkSync(filePath);
            subdirDeletedCount++;
            deletedCount++;
          } else {
            keptCount++;
          }
        }
        
        console.log(`Podkatalog ${path.basename(dir)}: usunięto ${subdirDeletedCount} wiadomości`);
      }
    } catch (e) {
      console.error(`Błąd podczas przetwarzania katalogu ${dir}:`, e.message);
    }
  }
  
  console.log(`Wiadomości: usunięto ${deletedCount}, zachowano ${keptCount}`);
}

// Funkcja oczyszczająca agentów
function cleanupAgents() {
  console.log('\nCzyszczenie agentów...');
  
  if (!fs.existsSync(DISCOVERY_PATH) || !fs.existsSync(STATUS_PATH)) {
    console.log('Katalogi protokołu nie istnieją.');
    return;
  }
  
  // Wczytaj status agentów
  const statusFile = path.join(STATUS_PATH, 'agents_status.json');
  let statusData = { active_agents: {} };
  
  if (fs.existsSync(statusFile)) {
    try {
      statusData = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
    } catch (e) {
      console.error('Błąd podczas wczytywania statusu agentów:', e.message);
    }
  }
  
  // Wczytaj informacje o agentach
  const discoveryFiles = fs.readdirSync(DISCOVERY_PATH)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(DISCOVERY_PATH, f));
  
  let activeAgents = [];
  let inactiveAgents = [];
  let duplicateAgents = {}; // Grupuj agentów według nazwy
  
  // Znajdź aktywnych i nieaktywnych agentów
  for (const file of discoveryFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const agentInfo = JSON.parse(content);
      
      // Grupuj agentów według nazwy
      if (!duplicateAgents[agentInfo.name]) {
        duplicateAgents[agentInfo.name] = [];
      }
      duplicateAgents[agentInfo.name].push(agentInfo);
      
      if (isAgentActive(agentInfo, statusData)) {
        activeAgents.push(agentInfo);
      } else {
        inactiveAgents.push(agentInfo);
      }
    } catch (e) {
      console.error(`Błąd podczas przetwarzania pliku ${file}:`, e.message);
    }
  }
  
  console.log(`Znaleziono ${activeAgents.length} aktywnych agentów i ${inactiveAgents.length} nieaktywnych.`);
  
  // Sprawdź duplikaty agentów
  let duplicates = 0;
  for (const [name, agents] of Object.entries(duplicateAgents)) {
    if (agents.length > 1) {
      duplicates++;
      console.log(`\nZnaleziono ${agents.length} agentów z nazwą "${name}":`);
      
      // Posortuj agentów według czasu utworzenia (najnowsi pierwsi)
      agents.sort((a, b) => {
        const dateA = new Date(a.created_at || 0);
        const dateB = new Date(b.created_at || 0);
        return dateB - dateA;
      });
      
      // Wyświetl informacje o agentach
      agents.forEach((agent, index) => {
        const active = isAgentActive(agent, statusData);
        const createdAt = agent.created_at ? new Date(agent.created_at).toLocaleString() : 'nieznane';
        console.log(`  ${index + 1}. ID: ${agent.id} | Utworzony: ${createdAt} | Aktywny: ${active}`);
      });
      
      // Zachowaj tylko najnowszego, aktywnego agenta
      const newestActive = agents.find(a => isAgentActive(a, statusData));
      
      if (newestActive) {
        console.log(`  -> Zostawiam aktywnego agenta: ${newestActive.id}`);
        
        // Usuń pozostałych agentów
        for (const agent of agents) {
          if (agent.id !== newestActive.id) {
            const discoveryPath = path.join(DISCOVERY_PATH, `${agent.id}.json`);
            if (fs.existsSync(discoveryPath)) {
              fs.unlinkSync(discoveryPath);
              console.log(`  -> Usunięto agenta: ${agent.id}`);
            }
            
            // Usuń z statusu
            if (statusData.active_agents[agent.id]) {
              delete statusData.active_agents[agent.id];
            }
          }
        }
      } else {
        // Brak aktywnych agentów, zachowaj najnowszego
        const newest = agents[0];
        console.log(`  -> Zostawiam najnowszego agenta: ${newest.id}`);
        
        // Usuń pozostałych agentów
        for (const agent of agents) {
          if (agent.id !== newest.id) {
            const discoveryPath = path.join(DISCOVERY_PATH, `${agent.id}.json`);
            if (fs.existsSync(discoveryPath)) {
              fs.unlinkSync(discoveryPath);
              console.log(`  -> Usunięto agenta: ${agent.id}`);
            }
            
            // Usuń z statusu
            if (statusData.active_agents[agent.id]) {
              delete statusData.active_agents[agent.id];
            }
          }
        }
      }
    }
  }
  
  if (duplicates === 0) {
    console.log('Nie znaleziono zduplikowanych agentów.');
  }
  
  // Usuń nieaktywnych agentów
  console.log('\nUsuwanie nieaktywnych agentów...');
  let removedCount = 0;
  
  for (const agent of inactiveAgents) {
    try {
      // Usuń z discovery
      const discoveryPath = path.join(DISCOVERY_PATH, `${agent.id}.json`);
      if (fs.existsSync(discoveryPath)) {
        fs.unlinkSync(discoveryPath);
        removedCount++;
      }
      
      // Usuń z statusu
      if (statusData.active_agents[agent.id]) {
        delete statusData.active_agents[agent.id];
      }
      
      // Usuń katalog wiadomości agenta
      const agentMessagesDir = path.join(MESSAGES_PATH, agent.id);
      if (fs.existsSync(agentMessagesDir)) {
        const files = fs.readdirSync(agentMessagesDir);
        for (const file of files) {
          fs.unlinkSync(path.join(agentMessagesDir, file));
        }
        fs.rmdirSync(agentMessagesDir);
      }
    } catch (e) {
      console.error(`Błąd podczas usuwania agenta ${agent.id}:`, e.message);
    }
  }
  
  console.log(`Usunięto ${removedCount} nieaktywnych agentów.`);
  
  // Aktualizuj plik statusu
  statusData.last_update = new Date().toISOString();
  fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
  console.log('Zaktualizowano plik statusu agentów.');
}

// Funkcja weryfikująca i naprawiająca karty agentów
function verifyAgentCards() {
  console.log('\nWeryfikacja kart agentów...');
  
  if (!fs.existsSync(CARDS_PATH)) {
    console.log('Katalog kart agentów nie istnieje.');
    return;
  }
  
  const cardFiles = fs.readdirSync(CARDS_PATH)
    .filter(f => f.endsWith('.json') && f !== 'AgentCard.json')
    .map(f => path.join(CARDS_PATH, f));
  
  let validCount = 0;
  let fixedCount = 0;
  let errorCount = 0;
  
  for (const file of cardFiles) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      let agentCard = JSON.parse(content);
      let modified = false;
      
      // Sprawdź poprawność pliku
      if (!agentCard.id || agentCard.id === "00000000-0000-0000-0000-000000000000") {
        agentCard.id = crypto.randomUUID().toUpperCase();
        modified = true;
        console.log(`Naprawiono UUID w karcie: ${path.basename(file)}`);
      }
      
      // Sprawdź ścieżki API
      if (agentCard.apis) {
        if (agentCard.apis.message_endpoint && 
            (agentCard.apis.message_endpoint.includes('/tmp/quantum-scout') || 
             !agentCard.apis.message_endpoint.includes('.a2a'))) {
          agentCard.apis.message_endpoint = path.join(PROJECT_ROOT, '.a2a', 'messages');
          modified = true;
        }
        
        if (agentCard.apis.discovery_endpoint && 
            (agentCard.apis.discovery_endpoint.includes('/tmp/quantum-scout') || 
             !agentCard.apis.discovery_endpoint.includes('.a2a'))) {
          agentCard.apis.discovery_endpoint = path.join(PROJECT_ROOT, '.a2a', 'discovery');
          modified = true;
        }
        
        if (modified) {
          console.log(`Naprawiono ścieżki API w karcie: ${path.basename(file)}`);
        }
      }
      
      // Zapisz naprawioną kartę
      if (modified) {
        fs.writeFileSync(file, JSON.stringify(agentCard, null, 2));
        fixedCount++;
      } else {
        validCount++;
      }
    } catch (e) {
      console.error(`Błąd podczas przetwarzania karty ${file}:`, e.message);
      errorCount++;
    }
  }
  
  console.log(`Karty agentów: poprawne: ${validCount}, naprawione: ${fixedCount}, błędy: ${errorCount}`);
}

// Funkcja inicjalizująca strukturę katalogów protokołu
function initializeProtocolDirectories() {
  console.log('\nInicjalizacja struktury katalogów protokołu...');
  
  const dirs = [
    BASE_PATH,
    DISCOVERY_PATH,
    MESSAGES_PATH,
    STATUS_PATH,
    path.join(BASE_PATH, 'orchestrator'),
    path.join(MESSAGES_PATH, 'read')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Utworzono katalog: ${dir}`);
    }
  }
  
  // Inicjalizuj plik statusu, jeśli nie istnieje
  const statusFile = path.join(STATUS_PATH, 'agents_status.json');
  if (!fs.existsSync(statusFile)) {
    const statusData = {
      active_agents: {},
      last_update: new Date().toISOString()
    };
    fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
    console.log('Utworzono plik statusu agentów.');
  }
  
  console.log('Struktura katalogów protokołu została zainicjalizowana.');
}

// Funkcja główna
function main() {
  console.log('=== lbrxAgents Protocol Cleanup ===');
  console.log(`Ścieżka projektu: ${PROJECT_ROOT}`);
  console.log(`Ścieżka protokołu: ${BASE_PATH}`);
  
  // Inicjalizuj strukturę katalogów
  initializeProtocolDirectories();
  
  // Oczyść wiadomości
  cleanupMessages();
  
  // Oczyść agentów
  cleanupAgents();
  
  // Weryfikuj karty agentów
  verifyAgentCards();
  
  console.log('\nCzyszczenie protokołu zakończone.');
}

// Uruchom program
main();