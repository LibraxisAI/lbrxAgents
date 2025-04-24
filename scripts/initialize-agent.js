#!/usr/bin/env node

/**
 * Script for initializing a new agent from template
 * Skrypt do inicjalizacji nowego agenta z szablonu
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// Ścieżki plików
const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'enhanced-agent-template.js');
const TARGET_DIR = path.join(__dirname, '..', 'examples', 'agents');
const CARDS_DIR = path.join(__dirname, '..', 'cards');
const PROTOCOL_DIR = path.join(__dirname, '..', '.a2a');

// Funkcja generująca UUID
function generateUUID() {
  try {
    // Spróbuj użyć komendy uuidgen
    return execSync('uuidgen').toString().trim().toUpperCase();
  } catch (e) {
    // Fallback - użyj crypto.randomUUID
    return crypto.randomUUID().toUpperCase();
  }
}

// Funkcja do zapytania o dane wejściowe
function promptQuestion(question) {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer);
    });
  });
}

// Inicjalizacja katalogów protokołu
function initializeProtocolDirectories() {
  console.log('Inicjalizacja katalogów protokołu...');
  
  const dirs = [
    PROTOCOL_DIR,
    path.join(PROTOCOL_DIR, 'discovery'),
    path.join(PROTOCOL_DIR, 'messages'),
    path.join(PROTOCOL_DIR, 'messages', 'read'),
    path.join(PROTOCOL_DIR, 'status'),
    path.join(PROTOCOL_DIR, 'orchestrator'),
    CARDS_DIR
  ];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`- Utworzono katalog: ${dir}`);
    }
  }
  
  // Inicjalizuj plik statusu, jeśli nie istnieje
  const statusFile = path.join(PROTOCOL_DIR, 'status', 'agents_status.json');
  if (!fs.existsSync(statusFile)) {
    const statusData = {
      active_agents: {},
      last_update: new Date().toISOString()
    };
    fs.writeFileSync(statusFile, JSON.stringify(statusData, null, 2));
    console.log('- Utworzono plik statusu agentów');
  }
  
  console.log('Struktura katalogów protokołu zainicjalizowana.');
}

// Tworzenie pliku instrukcji dla agenta
function createInstructionsFile(uuid, agentName, agentDescription) {
  console.log('Tworzenie pliku instrukcji dla agenta...');
  
  // Ścieżki do plików instrukcji
  const templatePathPL = path.join(__dirname, '..', 'docs', 'instructions', 'AGENT_PROTOCOL_INSTRUCTIONS.md');
  const templatePathEN = path.join(__dirname, '..', 'docs', 'en', 'AGENT_INSTRUCTIONS.md');
  
  let instructions = '';
  let templatePath = '';
  
  // Sprawdź, który szablon instrukcji istnieje
  if (fs.existsSync(templatePathPL)) {
    templatePath = templatePathPL;
  } else if (fs.existsSync(templatePathEN)) {
    templatePath = templatePathEN;
  } else {
    console.warn('Ostrzeżenie: Nie znaleziono pliku szablonu instrukcji.');
    return null;
  }
  
  // Wczytaj szablon instrukcji
  instructions = fs.readFileSync(templatePath, 'utf8');
  
  // Podmień dane w instrukcjach
  instructions = instructions.replace(/\[WSTAW_UUID_TUTAJ\]|\[INSERT_UUID_HERE\]/g, uuid);
  instructions = instructions.replace(/\[NAZWA_AGENTA\]|\[AGENT_NAME\]/g, agentName);
  instructions = instructions.replace(/\[KRÓTKI_OPIS_AGENTA\]|\[SHORT_AGENT_DESCRIPTION\]/g, agentDescription || '');
  instructions = instructions.replace(/\[OPIS_ZADANIA\]|\[TASK_DESCRIPTION\]/g, 'Communicate with other agents and respond to their messages. Test the A2A protocol functionality.');
  
  // Zapisz plik instrukcji
  const instructionsFileName = `${agentName.replace(/\s+/g, '')}-instructions.md`;
  const instructionsPath = path.join(__dirname, '..', instructionsFileName);
  fs.writeFileSync(instructionsPath, instructions);
  
  console.log(`- Utworzono plik instrukcji: ${instructionsPath}`);
  return instructionsPath;
}

// Główna funkcja
async function main() {
  console.log('=== LBRX Agent Initializer ===');
  
  // Zainicjalizuj strukturę katalogów protokołu
  initializeProtocolDirectories();
  
  // Sprawdź, czy szablon istnieje
  if (!fs.existsSync(TEMPLATE_PATH)) {
    console.error(`Błąd: Nie znaleziono szablonu agenta: ${TEMPLATE_PATH}`);
    process.exit(1);
  }
  
  // Sprawdź, czy katalog docelowy istnieje
  if (!fs.existsSync(TARGET_DIR)) {
    console.log(`Tworzenie katalogu docelowego: ${TARGET_DIR}`);
    fs.mkdirSync(TARGET_DIR, { recursive: true });
  }
  
  // Pobierz dane z argumentów lub zapytaj
  let agentName, agentDescription, capabilities;
  
  if (process.argv.length > 2) {
    agentName = process.argv[2];
    agentDescription = process.argv[3] || '';
    capabilities = process.argv[4] || '';
    
    console.log(`Nazwa agenta: ${agentName}`);
    console.log(`Opis: ${agentDescription}`);
    console.log(`Możliwości: ${capabilities}`);
  } else {
    // Zapytaj o dane agenta
    agentName = await promptQuestion('Podaj nazwę agenta (bez spacji, np. AnalyticsAgent): ');
    
    if (!agentName) {
      console.error('Błąd: Nazwa agenta jest wymagana.');
      process.exit(1);
    }
    
    agentDescription = await promptQuestion('Podaj opis agenta: ');
    capabilities = await promptQuestion('Podaj możliwości agenta (oddzielone przecinkami): ');
  }
  
  // Generuj UUID
  const uuid = generateUUID();
  console.log(`Wygenerowano UUID: ${uuid}`);
  
  // Przygotuj ścieżki plików
  const agentFileName = `${agentName.replace(/\s+/g, '-').toLowerCase()}-agent.js`;
  const targetPath = path.join(TARGET_DIR, agentFileName);
  
  // Sprawdź, czy plik już istnieje
  if (fs.existsSync(targetPath) && process.argv.length <= 2) {
    const overwrite = await promptQuestion(`Plik ${targetPath} już istnieje. Nadpisać? (t/N): `);
    if (overwrite.toLowerCase() !== 't') {
      console.log('Anulowano.');
      process.exit(0);
    }
  }
  
  // Wczytaj szablon
  let templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  
  // Podmień dane w szablonie
  templateContent = templateContent.replace(
    /const AGENT_UUID = ["']([^"']*)["'];/,
    `const AGENT_UUID = "${uuid}";`
  );
  
  templateContent = templateContent.replace(
    /const AGENT_NAME = ["']([^"']*)["'];/,
    `const AGENT_NAME = "${agentName}";`
  );
  
  templateContent = templateContent.replace(
    /const AGENT_DESCRIPTION = ["']([^"']*)["'];/,
    `const AGENT_DESCRIPTION = "${agentDescription || 'Agent protokołu LBRX A2A'}";`
  );
  
  // Dodaj ustawienie ścieżki bazowej (krytyczne!)
  if (!templateContent.includes("agentApi.setBasePath")) {
    const basePathCode = `\n// KRYTYCZNE - ustawienie ścieżki bazowej protokołu\nagentApi.setBasePath(path.join(process.cwd(), '.a2a'));\n`;
    templateContent = templateContent.replace(/const AGENT_CAPABILITIES = \[\s*[^]*?\];/s, 
      (match) => `${match}\n${basePathCode}`);
  }
  
  // Parsuj i podmień możliwości
  if (capabilities) {
    const capsArray = capabilities.split(',')
      .map(cap => cap.trim())
      .filter(cap => cap)
      .map(cap => `  "${cap}"`);
    
    if (capsArray.length > 0) {
      const capsString = capsArray.join(',\n');
      templateContent = templateContent.replace(
        /const AGENT_CAPABILITIES = \[\s*([^]*?)\s*\];/s,
        `const AGENT_CAPABILITIES = [\n${capsString}\n];`
      );
    }
  }
  
  // Upewnij się, że jest ograniczenie czasu działania
  if (!templateContent.includes("MAX_RUNTIME")) {
    const runtimeCode = `\n// KRYTYCZNE - ograniczenie czasu działania\nlet runtime = 0;\nconst MAX_RUNTIME = 60000; // 60 sekund\nconst CHECK_INTERVAL = 3000; // 3 sekundy\n`;
    
    // Dodaj przed główną pętlą
    templateContent = templateContent.replace(/while\s*\(.*?\)\s*{/s, 
      (match) => `${runtimeCode}\n${match}`);
    
    // Upewnij się, że pętla ma ograniczenie czasu
    templateContent = templateContent.replace(/while\s*\((.*?)\)\s*{/s, 
      `while (runtime < MAX_RUNTIME) {`);
    
    // Dodaj aktualizację licznika czasu
    templateContent = templateContent.replace(/\s*\/\/ Pauza przed kolejnym sprawdzeniem\s*.*?setTimeout.*?\);/s, 
      `\n      // Pauza przed kolejnym sprawdzeniem\n      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));\n      runtime += CHECK_INTERVAL;`);
  }
  
  // Upewnij się, że jest wyrejestrowywanie agenta przy zakończeniu
  if (!templateContent.includes("deregisterAgent")) {
    const deregisterCode = `\n\n  // KRYTYCZNE - wyrejestruj agenta przy zakończeniu\n  console.log("Wyrejestrowywanie agenta...");\n  agentApi.deregisterAgent(AGENT_UUID);\n  console.log("Agent wyrejestrowany z systemu.");\n`;
    
    // Dodaj przed końcem funkcji głównej
    templateContent = templateContent.replace(/\}(\s*\/\/ Uruchom agenta)/s, 
      `${deregisterCode}}\n$1`);
  }
  
  // Zapisz plik agenta
  fs.writeFileSync(targetPath, templateContent);
  console.log(`Agent został utworzony: ${targetPath}`);
  
  // Dodaj wykonaj chmod +x
  try {
    fs.chmodSync(targetPath, '755');
  } catch (e) {
    console.warn('Ostrzeżenie: Nie udało się ustawić uprawnień wykonywania dla pliku.');
  }
  
  // Utwórz plik instrukcji
  const instructionsPath = createInstructionsFile(uuid, agentName, agentDescription);
  
  console.log('\n=== Agent gotowy do użycia ===');
  console.log(`UUID: ${uuid}`);
  console.log(`Plik agenta: ${targetPath}`);
  if (instructionsPath) {
    console.log(`Instrukcje: ${instructionsPath}`);
  }
  
  console.log('\nAby uruchomić agenta, wykonaj:');
  console.log(`  node ${targetPath}`);
  
  console.log('\nPo zakończeniu testów, wykonaj polecenie czyszczące protokół:');
  console.log('  node scripts/cleanup-protocol.js');
  
  console.log('\nPowodzenia!');
}

// Uruchom program
main().catch(err => {
  console.error('Błąd:', err);
  process.exit(1);
});