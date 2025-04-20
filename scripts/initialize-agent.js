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

// Główna funkcja
async function main() {
  console.log('=== LBRX Agent Initializer ===');
  
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
  
  // Zapytaj o dane agenta
  const agentName = await promptQuestion('Podaj nazwę agenta (bez spacji, np. AnalyticsAgent): ');
  
  if (!agentName) {
    console.error('Błąd: Nazwa agenta jest wymagana.');
    process.exit(1);
  }
  
  const agentDescription = await promptQuestion('Podaj opis agenta: ');
  const capabilities = await promptQuestion('Podaj możliwości agenta (oddzielone przecinkami): ');
  
  // Generuj UUID
  const uuid = generateUUID();
  console.log(`Wygenerowano UUID: ${uuid}`);
  
  // Przygotuj ścieżkę pliku docelowego
  const targetPath = path.join(TARGET_DIR, `${agentName.replace(/\s+/g, '-').toLowerCase()}.js`);
  
  // Sprawdź, czy plik już istnieje
  if (fs.existsSync(targetPath)) {
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
    'const AGENT_UUID = "00000000-0000-0000-0000-000000000000";',
    `const AGENT_UUID = "${uuid}";`
  );
  
  templateContent = templateContent.replace(
    'const AGENT_NAME = "TemplateAgent";',
    `const AGENT_NAME = "${agentName}";`
  );
  
  templateContent = templateContent.replace(
    'const AGENT_DESCRIPTION = "Szablon agenta protokołu LBRX A2A";',
    `const AGENT_DESCRIPTION = "${agentDescription || 'Agent protokołu LBRX A2A'}";`
  );
  
  // Parsuj i podmień możliwości
  if (capabilities) {
    const capsArray = capabilities.split(',')
      .map(cap => cap.trim())
      .filter(cap => cap)
      .map(cap => `  "${cap}"`);
    
    if (capsArray.length > 0) {
      const capsString = capsArray.join(',\n');
      templateContent = templateContent.replace(
        /const AGENT_CAPABILITIES = \[\s*"capability1",\s*"capability2",\s*"capability3"\s*\];/s,
        `const AGENT_CAPABILITIES = [\n${capsString}\n];`
      );
    }
  }
  
  // Zapisz plik
  fs.writeFileSync(targetPath, templateContent);
  console.log(`Agent został utworzony: ${targetPath}`);
  
  // Dodaj wykonaj chmod +x
  try {
    fs.chmodSync(targetPath, '755');
  } catch (e) {
    console.warn('Ostrzeżenie: Nie udało się ustawić uprawnień wykonywania dla pliku.');
  }
  
  console.log('\nAby uruchomić agenta, wykonaj:');
  console.log(`  node ${targetPath}`);
  
  console.log('\nPowodzenia!');
}

// Uruchom program
main().catch(err => {
  console.error('Błąd:', err);
  process.exit(1);
});