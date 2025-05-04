/**
 * Deep Clean Protocol - Głębokie czyszczenie protokołu
 * UWAGA: Ta operacja usuwa WSZYSTKIE wiadomości i resetuje stan protokołu!
 */

const fs = require('fs');
const path = require('path');

// Ścieżki protokołu
const PROJECT_ROOT = process.cwd();
const BASE_PATH = path.join(PROJECT_ROOT, '.a2a');
const DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
const MESSAGES_PATH = path.join(BASE_PATH, 'messages');
const STATUS_PATH = path.join(BASE_PATH, 'status');
const ORCHESTRATOR_PATH = path.join(BASE_PATH, 'orchestrator');

// Funkcja do rekurencyjnego usuwania katalogów
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Rekurencyjne usuwanie podkatalogów
        removeDir(curPath);
      } else {
        // Usuwanie plików
        fs.unlinkSync(curPath);
      }
    });
    
    // Usuwanie katalogu
    fs.rmdirSync(dirPath);
  }
}

// Funkcja do czyszczenia wszystkich wiadomości
function clearMessages() {
  console.log('Usuwanie wszystkich wiadomości...');
  
  if (fs.existsSync(MESSAGES_PATH)) {
    // Przechowujemy listę katalogów do ponownego utworzenia
    const subDirs = ['read'];
    
    // Usuwamy cały katalog wiadomości
    removeDir(MESSAGES_PATH);
    
    // Tworzymy katalog wiadomości od nowa
    fs.mkdirSync(MESSAGES_PATH, { recursive: true });
    
    // Tworzymy standardowe podkatalogi
    for (const dir of subDirs) {
      fs.mkdirSync(path.join(MESSAGES_PATH, dir), { recursive: true });
    }
    
    console.log('Wszystkie wiadomości usunięte.');
  } else {
    console.log('Katalog wiadomości nie istnieje.');
  }
}

// Funkcja do resetowania stanu protokołu
function resetProtocolState() {
  console.log('Resetowanie stanu protokołu...');
  
  // Usuwamy katalog statusu
  if (fs.existsSync(STATUS_PATH)) {
    removeDir(STATUS_PATH);
    fs.mkdirSync(STATUS_PATH, { recursive: true });
    
    // Tworzymy nowy plik statusu
    const statusFile = path.join(STATUS_PATH, 'agents_status.json');
    const statusData = {
      active_agents: {},
      last_update: new Date().toISOString()
    };
    fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
    
    console.log('Stan protokołu zresetowany.');
  } else {
    console.log('Katalog statusu nie istnieje.');
  }
}

// Funkcja do czyszczenia discovery
function clearDiscovery() {
  console.log('Czyszczenie discovery...');
  
  if (fs.existsSync(DISCOVERY_PATH)) {
    const files = fs.readdirSync(DISCOVERY_PATH);
    
    for (const file of files) {
      fs.unlinkSync(path.join(DISCOVERY_PATH, file));
    }
    
    console.log(`Usunięto ${files.length} plików discovery.`);
  } else {
    console.log('Katalog discovery nie istnieje.');
  }
}

// Funkcja do czyszczenia orchestrator
function clearOrchestrator() {
  console.log('Czyszczenie orchestrator...');
  
  if (fs.existsSync(ORCHESTRATOR_PATH)) {
    const files = fs.readdirSync(ORCHESTRATOR_PATH);
    
    for (const file of files) {
      fs.unlinkSync(path.join(ORCHESTRATOR_PATH, file));
    }
    
    console.log(`Usunięto ${files.length} plików orchestrator.`);
  } else {
    console.log('Katalog orchestrator nie istnieje.');
  }
}

// Funkcja do inicjalizacji struktury katalogów
function initializeProtocolDirectories() {
  console.log('Inicjalizacja struktury katalogów protokołu...');
  
  // Tworzymy główny katalog protokołu
  if (!fs.existsSync(BASE_PATH)) {
    fs.mkdirSync(BASE_PATH, { recursive: true });
  }
  
  // Tworzymy pozostałe katalogi
  const dirs = [
    DISCOVERY_PATH,
    MESSAGES_PATH,
    STATUS_PATH,
    ORCHESTRATOR_PATH,
    path.join(MESSAGES_PATH, 'read')
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
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
  }
  
  console.log('Struktura katalogów protokołu zainicjalizowana.');
}

// Funkcja główna
function main() {
  console.log('=== lbrxAgents Protocol Deep Clean ===');
  console.log(`Ścieżka projektu: ${PROJECT_ROOT}`);
  console.log(`Ścieżka protokołu: ${BASE_PATH}`);
  console.log('UWAGA: Ta operacja spowoduje CAŁKOWITE WYCZYSZCZENIE protokołu!');
  
  // Rozpocznij czyszczenie bez pytania o potwierdzenie
  console.log('Rozpoczynam głębokie czyszczenie protokołu...');
  
  // Czyszczenie wiadomości
  clearMessages();
  
  // Czyszczenie discovery
  clearDiscovery();
  
  // Czyszczenie orchestrator
  clearOrchestrator();
  
  // Resetowanie stanu protokołu
  resetProtocolState();
  
  // Inicjalizacja struktury katalogów
  initializeProtocolDirectories();
  
  console.log('\nGłębokie czyszczenie protokołu zakończone.');
  console.log('Wszystkie wiadomości i stan protokołu zostały usunięte.');
  console.log('Protokół został zresetowany do stanu początkowego.');
  console.log('\nPowodzenia!');
}

// Uruchomienie programu
main();