```
-### Usage
-
-1.  **Ensure Homebrew is installed:** Visit [https://brew.s
h/](https://brew.sh/) if needed.
-2.  **Clone this repository** or download the `mlx-startup.
sh` script.
-3.  **Make the script executable:** `chmod +x mlx-startup.s
h`
-4.  **Run the script using ZSH:** `zsh mlx-startup.sh`
-5.  **Follow Post-Installation Steps:** Carefully read and 
execute the steps printed at the end of the script, especial
ly restarting the terminal.
-
-### Key Features & Structure
-
-1.  **Homebrew Check & Update:** Ensures Brew is present an
d updated.
-2.  **Brew Package Installation:** Installs a comprehensive
 list of command-line tools, libraries (including build depe
ndencies like `openssl@3`, `readline`, etc.), and applicatio
ns (`cloudflared`, `zerotier-one`).
-3.  **Pyenv Setup:** Installs `pyenv` and configures `~/.zs
hrc` for managing Python versions. Installs a specific Pytho
n version (default: 3.12.3).
-4.  **UV Configuration:** Sets up `uv`, the fast package ma
nager/installer.
-5.  **Project Directory & Venv:** Creates `~/ml-projects` a
nd a `.venv` within it using `uv`.
-6.  **Core ML Installation:** Installs fundamental ML packa
ges (NumPy, SciPy, Pandas, MLX, MLX-LM, Transformers, etc.) 
into the `.venv`.
-7.  **Custom Project Setup:** Clones and installs dependenc
ies for `csm-mlx` and `sesame-csm-ui`.
-8.  **Workflow Tools Installation:** Installs linters, form
atters, testing tools, etc. into the `.venv`.
-9.  **Directory Prep:** Creates a directory for voice sampl
es.
-10. **Git Configuration:** Sets up a global `.gitignore`.
-11. **Post-Installation Guide:** Provides crucial manual st
eps required after the script finishes.
-
-### Post-Installation Steps (Summary)
-
-*   **Restart Terminal:** Essential for `pyenv` initializat
ion.
-*   **Activate Venv:** `cd ~/ml-projects && source .venv/bi
n/activate` before running Python projects.
-*   **Login to Services:** `gh auth login`, `cloudflared ac
cess login`, Zerotier One app login.
-*   **Download Models:** Manually download large models lik
e `csm-1b-mlx` if needed.
-*   **Test Installations:** Run provided test commands for 
MLX-LM.
-*   **(Optional) Change Global Python:** Use `pyenv global 
<version>` if needed.
-
----
-
-## MLX Framework & Ecosystem Insights (Summary from Session
)
-
-This section captures key learnings and considerations disc
ussed regarding the use of MLX, particularly on high-spec Ap
ple Silicon hardware.
-
-### 1. Technology Stack Assessment
-
-*   **Hardware:** New Apple Silicon platforms, especially M
2/M3 Ultra (with up to 512GB RAM) and M3/M4 Max are highly s
uitable for ML Tasks due to its massive **Unified Memory**, 
allowing large models to reside entirely in vRAM accessible 
by both CPU and GPU cores efficiently.
-*   **Operating System:** macOS (e.g., 15.3) provides a sta
ble base. ZSH is often the preferred shell.
-*   **MLX vs. PyTorch:** MLX demonstrates significant perfo
rmance advantages over PyTorch (via MPS backend) on Apple Si
licon, especially for inference and fine-tuning tasks that l
everage the Unified Memory architecture.
-*   **Python Environment:** Robust management is critical.
-    *   **Tools:** `pyenv` (version management), `uv` (fast
 installation/venv), `conda`, `venv` are options. `uv` combi
ned with `pyenv` offers a modern, fast approach.
-    *   **Dependency Pinning:** Crucial for reproducibility
 (using `requirements.txt` or `pyproject.toml` managed by `u
v`).
-*   **Scripting:** Ensure scripts explicitly use the intend
ed interpreter (e.g., `#!/bin/zsh`) and handle environment s
ourcing correctly (e.g., using `eval "$(brew --prefix)/bin/b
rew shellenv"` instead of sourcing entire `.zshrc`).
-
-### 2. Shared Workstation & LLM Host
-
-*   **Suitability:** The high RAM and compute power make th
e Mac Studio M3 Ultra technically capable of serving as both
 a shared ML development machine and a host for large models
 (like Llama 4.0 Maverick).
-*   **Challenges:** Primarily organizational and resource m
anagement, not raw capability.
-    *   **Shared Environment Management:** Lack of establis
hed best practices for Macs as shared *nodes*. Requires clea
r strategies for:
-        *   **Access:** SSH, Screen Sharing, VNC? User acco
unts?
-        *   **Environment Isolation:** Single shared venv (
managed via `uv sync`), multiple user venvs, or containeriza
tion (e.g., OrbStack, Docker Desktop)?
-        *   **Resource Allocation:** How to manage concurre
nt usage (CPU, GPU, RAM)? Queuing systems? Scheduling? Monit
oring is key.
-    *   **LLM Serving:**
-        *   **Tools:** LM Studio, Ollama, MLX-LM server (vi
a FastAPI), Exo. Each has pros and cons regarding ease of us
e, performance, and configuration.
-        *   **Resource Conflicts:** Serving a large LLM con
sumes significant RAM/compute, potentially conflicting with 
users running intensive training/fine-tuning jobs. Prioritiz
ation or scheduling might be needed.
-    *   **Data Management:** Shared directories, permission
s, backup strategies are vital.
-
-### 3. Networking and Daily Workflow
-
-*   **Secure Access:** Tools like **ZeroTier** (creates vir
tual LANs) and **Cloudflare ZeroTrust** (`cloudflared` tunne
ls) are effective for providing secure remote access to the 
workstation without exposing it directly to the internet.
-*   **Version Control:** **Git** (with **Git LFS** for larg
e files/models) is standard and essential. A global `.gitign
ore` helps keep repositories clean.
-*   **Code Quality & Testing:** Linters (`Ruff`), formatter
s, and testing frameworks (`pytest`) are crucial for maintai
ning code quality, especially in shared or complex projects.
-*   **Experiment Tracking:** Tools like **WandB** (Weights 
& Biases) are valuable for logging metrics, parameters, and 
outputs during ML experiments.
-
----
-
-This summary reflects the state of discussion and planning 
as of April 9, 2025. The ML landscape evolves rapidly, so co
ntinued evaluation and adaptation are necessary.
diff --git a/mcp-memory-service b/mcp-memory-service
new file mode 160000
index 0000000..5901ed2
--- /dev/null
+++ b/mcp-memory-service
@@ -0,0 +1 @@
+Subproject commit 5901ed214331f87763d4ccf031e75055ecd335e6
diff --git a/scripts/create-agent.sh b/scripts/create-agent.
sh
deleted file mode 100755
index 2af6094..0000000
--- a/scripts/create-agent.sh
+++ /dev/null
@@ -1,50 +0,0 @@
-#!/bin/bash
-
-# Skrypt do tworzenia nowego agenta
-
-if [ $# -lt 2 ]; then
-  echo "Użycie: $0 <nazwa-agenta> <opis> [zdolność1,zdolnoś
ć2,...]"
-  exit 1
-fi
-
-AGENT_NAME=$1
-AGENT_DESCRIPTION=$2
-CAPABILITIES=${3:-"coding,architecture,design"}
-
-# Generuj UUID
-AGENT_UUID=$(uuidgen)
-
-# Utwórz katalog agenta jeśli nie istnieje
-mkdir -p /tmp/quantum-scout/agents/messages
-mkdir -p /tmp/quantum-scout/agents/discovery
-
-# Utwórz kartę agenta
-mkdir -p "$(dirname "$0")/../cards"
-cat > "$(dirname "$0")/../cards/${AGENT_NAME}Card.json" <<E
OL
-{
-  "name": "${AGENT_NAME}",
-  "version": "1.0.0",
-  "id": "${AGENT_UUID}",
-  "description": "${AGENT_DESCRIPTION}",
-  "capabilities": [
-    $(echo $CAPABILITIES | sed 's/,/","/g' | sed 's/^/"/;s/
$/"/')
-  ],
-  "apis": {
-    "message_endpoint": "/tmp/quantum-scout/agents/messages
/",
-    "discovery_endpoint": "/tmp/quantum-scout/agents/discov
ery/"
-  },
-  "author": "${AGENT_NAME}",
-  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
-}
-EOL
-
-# Skopiuj szablon agenta
-sed "s/TWÓJ-UUID-TUTAJ/${AGENT_UUID}/g; s/NazwaAgenta/${AGE
NT_NAME}/g; s/Opis twojego agenta i jego roli/${AGENT_DESCRI
PTION}/g" "$(dirname "$0")/../templates/agent-template.js" >
 "$(dirname "$0")/../examples/agents/${AGENT_NAME}-agent.js"
-
-# Opublikuj możliwości
-node -e "const api = require('../src/agent-api.js'); api.pu
blishCapabilities('../cards/${AGENT_NAME}Card.json');"
-
-echo "Agent ${AGENT_NAME} utworzony pomyślnie!"
-echo "UUID: ${AGENT_UUID}"
-echo "Możesz uruchomić agenta poleceniem:"
-echo "node examples/agents/${AGENT_NAME}-agent.js"
diff --git a/scripts/deep-clean.js b/scripts/deep-clean.js
deleted file mode 100644
index 9af0558..0000000
--- a/scripts/deep-clean.js
+++ /dev/null
@@ -1,187 +0,0 @@
-/**
- * Deep Clean Protocol - Głębokie czyszczenie protokołu
- * UWAGA: Ta operacja usuwa WSZYSTKIE wiadomości i resetuje
 stan protokołu!
- */
-
-const fs = require('fs');
-const path = require('path');
-
-// Ścieżki protokołu
-const PROJECT_ROOT = process.cwd();
-const BASE_PATH = path.join(PROJECT_ROOT, '.a2a');
-const DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
-const MESSAGES_PATH = path.join(BASE_PATH, 'messages');
-const STATUS_PATH = path.join(BASE_PATH, 'status');
-const ORCHESTRATOR_PATH = path.join(BASE_PATH, 'orchestrato
r');
-
-// Funkcja do rekurencyjnego usuwania katalogów
-function removeDir(dirPath) {
-  if (fs.existsSync(dirPath)) {
-    fs.readdirSync(dirPath).forEach((file) => {
-      const curPath = path.join(dirPath, file);
-      if (fs.lstatSync(curPath).isDirectory()) {
-        // Rekurencyjne usuwanie podkatalogów
-        removeDir(curPath);
-      } else {
-        // Usuwanie plików
-        fs.unlinkSync(curPath);
-      }
-    });
-    
-    // Usuwanie katalogu
-    fs.rmdirSync(dirPath);
-  }
-}
-
-// Funkcja do czyszczenia wszystkich wiadomości
-function clearMessages() {
-  console.log('Usuwanie wszystkich wiadomości...');
-  
-  if (fs.existsSync(MESSAGES_PATH)) {
-    // Przechowujemy listę katalogów do ponownego utworzeni
a
-    const subDirs = ['read'];
-    
-    // Usuwamy cały katalog wiadomości
-    removeDir(MESSAGES_PATH);
-    
-    // Tworzymy katalog wiadomości od nowa
-    fs.mkdirSync(MESSAGES_PATH, { recursive: true });
-    
-    // Tworzymy standardowe podkatalogi
-    for (const dir of subDirs) {
-      fs.mkdirSync(path.join(MESSAGES_PATH, dir), { recursi
ve: true });
-    }
-    
-    console.log('Wszystkie wiadomości usunięte.');
-  } else {
-    console.log('Katalog wiadomości nie istnieje.');
-  }
-}
-
-// Funkcja do resetowania stanu protokołu
-function resetProtocolState() {
-  console.log('Resetowanie stanu protokołu...');
-  
-  // Usuwamy katalog statusu
-  if (fs.existsSync(STATUS_PATH)) {
-    removeDir(STATUS_PATH);
-    fs.mkdirSync(STATUS_PATH, { recursive: true });
-    
-    // Tworzymy nowy plik statusu
-    const statusFile = path.join(STATUS_PATH, 'agents_statu
s.json');
-    const statusData = {
-      active_agents: {},
-      last_update: new Date().toISOString()
-    };
-    fs.writeFileSync(statusFile, JSON.stringify(statusData,
 null, 2));
-    
-    console.log('Stan protokołu zresetowany.');
-  } else {
-    console.log('Katalog statusu nie istnieje.');
-  }
-}
-
-// Funkcja do czyszczenia discovery
-function clearDiscovery() {
-  console.log('Czyszczenie discovery...');
-  
-  if (fs.existsSync(DISCOVERY_PATH)) {
-    const files = fs.readdirSync(DISCOVERY_PATH);
-    
-    for (const file of files) {
-      fs.unlinkSync(path.join(DISCOVERY_PATH, file));
-    }
-    
-    console.log(`Usunięto ${files.length} plików discovery.
`);
-  } else {
-    console.log('Katalog discovery nie istnieje.');
-  }
-}
-
-// Funkcja do czyszczenia orchestrator
-function clearOrchestrator() {
-  console.log('Czyszczenie orchestrator...');
-  
-  if (fs.existsSync(ORCHESTRATOR_PATH)) {
-    const files = fs.readdirSync(ORCHESTRATOR_PATH);
-    
-    for (const file of files) {
-      fs.unlinkSync(path.join(ORCHESTRATOR_PATH, file));
-    }
-    
-    console.log(`Usunięto ${files.length} plików orchestrat
or.`);
-  } else {
-    console.log('Katalog orchestrator nie istnieje.');
-  }
-}
-
-// Funkcja do inicjalizacji struktury katalogów
-function initializeProtocolDirectories() {
-  console.log('Inicjalizacja struktury katalogów protokołu.
..');
-  
-  // Tworzymy główny katalog protokołu
-  if (!fs.existsSync(BASE_PATH)) {
-    fs.mkdirSync(BASE_PATH, { recursive: true });
-  }
-  
-  // Tworzymy pozostałe katalogi
-  const dirs = [
-    DISCOVERY_PATH,
-    MESSAGES_PATH,
-    STATUS_PATH,
-    ORCHESTRATOR_PATH,
-    path.join(MESSAGES_PATH, 'read')
-  ];
-  
-  for (const dir of dirs) {
-    if (!fs.existsSync(dir)) {
-      fs.mkdirSync(dir, { recursive: true });
-    }
-  }
-  
-  // Inicjalizuj plik statusu, jeśli nie istnieje
-  const statusFile = path.join(STATUS_PATH, 'agents_status.
json');
-  if (!fs.existsSync(statusFile)) {
-    const statusData = {
-      active_agents: {},
-      last_update: new Date().toISOString()
-    };
-    fs.writeFileSync(statusFile, JSON.stringify(statusData,
 null, 2));
-  }
-  
-  console.log('Struktura katalogów protokołu zainicjalizowa
na.');
-}
-
-// Funkcja główna
-function main() {
-  console.log('=== lbrxAgents Protocol Deep Clean ===');
-  console.log(`Ścieżka projektu: ${PROJECT_ROOT}`);
-  console.log(`Ścieżka protokołu: ${BASE_PATH}`);
-  console.log('UWAGA: Ta operacja spowoduje CAŁKOWITE WYCZY
SZCZENIE protokołu!');
-  
-  // Rozpocznij czyszczenie bez pytania o potwierdzenie
-  console.log('Rozpoczynam głębokie czyszczenie protokołu..
.');
-  
-  // Czyszczenie wiadomości
-  clearMessages();
-  
-  // Czyszczenie discovery
-  clearDiscovery();
-  
-  // Czyszczenie orchestrator
-  clearOrchestrator();
-  
-  // Resetowanie stanu protokołu
-  resetProtocolState();
-  
-  // Inicjalizacja struktury katalogów
-  initializeProtocolDirectories();
-  
-  console.log('\nGłębokie czyszczenie protokołu zakończone.
');
-  console.log('Wszystkie wiadomości i stan protokołu został
y usunięte.');
-  console.log('Protokół został zresetowany do stanu początk
owego.');
-  console.log('\nPowodzenia!');
-}
-
-// Uruchomienie programu
-main();
\ No newline at end of file
diff --git a/scripts/initialize-agent.js b/scripts/initializ
e-agent.js
deleted file mode 100644
index 82ec7aa..0000000
--- a/scripts/initialize-agent.js
+++ /dev/null
@@ -1,281 +0,0 @@
-#!/usr/bin/env node
-
-/**
- * Script for initializing a new agent from template
- * Skrypt do inicjalizacji nowego agenta z szablonu
- */
-
-const fs = require('fs');
-const path = require('path');
-const crypto = require('crypto');
-const { execSync } = require('child_process');
-
-// Ścieżki plików
-const TEMPLATE_PATH = path.join(__dirname, '..', 'templates
', 'enhanced-agent-template.js');
-const TARGET_DIR = path.join(__dirname, '..', 'examples', '
agents');
-const CARDS_DIR = path.join(__dirname, '..', 'cards');
-const PROTOCOL_DIR = path.join(__dirname, '..', '.a2a');
-
-// Funkcja generująca UUID
-function generateUUID() {
-  try {
-    // Spróbuj użyć komendy uuidgen
-    return execSync('uuidgen').toString().trim().toUpperCas
e();
-  } catch (e) {
-    // Fallback - użyj crypto.randomUUID
-    return crypto.randomUUID().toUpperCase();
-  }
-}
-
-// Funkcja do zapytania o dane wejściowe
-function promptQuestion(question) {
-  const readline = require('readline').createInterface({
-    input: process.stdin,
-    output: process.stdout
-  });
-
-  return new Promise((resolve) => {
-    readline.question(question, (answer) => {
-      readline.close();
-      resolve(answer);
-    });
-  });
-}
-
-// Inicjalizacja katalogów protokołu
-function initializeProtocolDirectories() {
-  console.log('Inicjalizacja katalogów protokołu...');
-  
-  const dirs = [
-    PROTOCOL_DIR,
-    path.join(PROTOCOL_DIR, 'discovery'),
-    path.join(PROTOCOL_DIR, 'messages'),
-    path.join(PROTOCOL_DIR, 'messages', 'read'),
-    path.join(PROTOCOL_DIR, 'status'),
-    path.join(PROTOCOL_DIR, 'orchestrator'),
-    CARDS_DIR
-  ];
-  
-  for (const dir of dirs) {
-    if (!fs.existsSync(dir)) {
-      fs.mkdirSync(dir, { recursive: true });
-      console.log(`- Utworzono katalog: ${dir}`);
-    }
-  }
-  
-  // Inicjalizuj plik statusu, jeśli nie istnieje
-  const statusFile = path.join(PROTOCOL_DIR, 'status', 'age
nts_status.json');
-  if (!fs.existsSync(statusFile)) {
-    const statusData = {
-      active_agents: {},
-      last_update: new Date().toISOString()
-    };
-    fs.writeFileSync(statusFile, JSON.stringify(statusData,
 null, 2));
-    console.log('- Utworzono plik statusu agentów');
-  }
-  
-  console.log('Struktura katalogów protokołu zainicjalizowa
na.');
-}
-
-// Tworzenie pliku instrukcji dla agenta
-function createInstructionsFile(uuid, agentName, agentDescr
iption) {
-  console.log('Tworzenie pliku instrukcji dla agenta...');
-  
-  // Ścieżki do plików instrukcji
-  const templatePathPL = path.join(__dirname, '..', 'docs',
 'instructions', 'AGENT_PROTOCOL_INSTRUCTIONS.md');
-  const templatePathEN = path.join(__dirname, '..', 'docs',
 'en', 'AGENT_INSTRUCTIONS.md');
-  
-  let instructions = '';
-  let templatePath = '';
-  
-  // Sprawdź, który szablon instrukcji istnieje
-  if (fs.existsSync(templatePathPL)) {
-    templatePath = templatePathPL;
-  } else if (fs.existsSync(templatePathEN)) {
-    templatePath = templatePathEN;
-  } else {
-    console.warn('Ostrzeżenie: Nie znaleziono pliku szablon
u instrukcji.');
-    return null;
-  }
-  
-  // Wczytaj szablon instrukcji
-  instructions = fs.readFileSync(templatePath, 'utf8');
-  
-  // Podmień dane w instrukcjach
-  instructions = instructions.replace(/\[WSTAW_UUID_TUTAJ\]
|\[INSERT_UUID_HERE\]/g, uuid);
-  instructions = instructions.replace(/\[NAZWA_AGENTA\]|\[A
GENT_NAME\]/g, agentName);
-  instructions = instructions.replace(/\[KRÓTKI_OPIS_AGENTA
\]|\[SHORT_AGENT_DESCRIPTION\]/g, agentDescription || '');
-  instructions = instructions.replace(/\[OPIS_ZADANIA\]|\[T
ASK_DESCRIPTION\]/g, 'Communicate with other agents and resp
ond to their messages. Test the A2A protocol functionality.'
);
-  
-  // Zapisz plik instrukcji
-  const instructionsFileName = `${agentName.replace(/\s+/g,
 '')}-instructions.md`;
-  const instructionsPath = path.join(__dirname, '..', instr
uctionsFileName);
-  fs.writeFileSync(instructionsPath, instructions);
-  
-  console.log(`- Utworzono plik instrukcji: ${instructionsP
ath}`);
-  return instructionsPath;
-}
-
-// Główna funkcja
-async function main() {
-  console.log('=== LBRX Agent Initializer ===');
-  
-  // Zainicjalizuj strukturę katalogów protokołu
-  initializeProtocolDirectories();
-  
-  // Sprawdź, czy szablon istnieje
-  if (!fs.existsSync(TEMPLATE_PATH)) {
-    console.error(`Błąd: Nie znaleziono szablonu agenta: ${
TEMPLATE_PATH}`);
-    process.exit(1);
-  }
-  
-  // Sprawdź, czy katalog docelowy istnieje
-  if (!fs.existsSync(TARGET_DIR)) {
-    console.log(`Tworzenie katalogu docelowego: ${TARGET_DI
R}`);
-    fs.mkdirSync(TARGET_DIR, { recursive: true });
-  }
-  
-  // Pobierz dane z argumentów lub zapytaj
-  let agentName, agentDescription, capabilities;
-  
-  if (process.argv.length > 2) {
-    agentName = process.argv[2];
-    agentDescription = process.argv[3] || '';
-    capabilities = process.argv[4] || '';
-    
-    console.log(`Nazwa agenta: ${agentName}`);
-    console.log(`Opis: ${agentDescription}`);
-    console.log(`Możliwości: ${capabilities}`);
-  } else {
-    // Zapytaj o dane agenta
-    agentName = await promptQuestion('Podaj nazwę agenta (b
ez spacji, np. AnalyticsAgent): ');
-    
-    if (!agentName) {
-      console.error('Błąd: Nazwa agenta jest wymagana.');
-      process.exit(1);
-    }
-    
-    agentDescription = await promptQuestion('Podaj opis age
nta: ');
-    capabilities = await promptQuestion('Podaj możliwości a
genta (oddzielone przecinkami): ');
-  }
-  
-  // Generuj UUID
-  const uuid = generateUUID();
-  console.log(`Wygenerowano UUID: ${uuid}`);
-  
-  // Przygotuj ścieżki plików
-  const agentFileName = `${agentName.replace(/\s+/g, '-').t
oLowerCase()}-agent.js`;
-  const targetPath = path.join(TARGET_DIR, agentFileName);
-  
-  // Sprawdź, czy plik już istnieje
-  if (fs.existsSync(targetPath) && process.argv.length <= 2
) {
-    const overwrite = await promptQuestion(`Plik ${targetPa
th} już istnieje. Nadpisać? (t/N): `);
-    if (overwrite.toLowerCase() !== 't') {
-      console.log('Anulowano.');
-      process.exit(0);
-    }
-  }
-  
-  // Wczytaj szablon
-  let templateContent = fs.readFileSync(TEMPLATE_PATH, 'utf
8');
-  
-  // Podmień dane w szablonie
-  templateContent = templateContent.replace(
-    /const AGENT_UUID = ["']([^"']*)["'];/,
-    `const AGENT_UUID = "${uuid}";`
-  );
-  
-  templateContent = templateContent.replace(
-    /const AGENT_NAME = ["']([^"']*)["'];/,
-    `const AGENT_NAME = "${agentName}";`
-  );
-  
-  templateContent = templateContent.replace(
-    /const AGENT_DESCRIPTION = ["']([^"']*)["'];/,
-    `const AGENT_DESCRIPTION = "${agentDescription || 'Agen
t protokołu LBRX A2A'}";`
-  );
-  
-  // Dodaj ustawienie ścieżki bazowej (krytyczne!)
-  if (!templateContent.includes("agentApi.setBasePath")) {
-    const basePathCode = `\n// KRYTYCZNE - ustawienie ścież
ki bazowej protokołu\nagentApi.setBasePath(path.join(process
.cwd(), '.a2a'));\n`;
-    templateContent = templateContent.replace(/const AGENT_
CAPABILITIES = \[\s*[^]*?\];/s, 
-      (match) => `${match}\n${basePathCode}`);
-  }
-  
-  // Parsuj i podmień możliwości
-  if (capabilities) {
-    const capsArray = capabilities.split(',')
-      .map(cap => cap.trim())
-      .filter(cap => cap)
-      .map(cap => `  "${cap}"`);
-    
-    if (capsArray.length > 0) {
-      const capsString = capsArray.join(',\n');
-      templateContent = templateContent.replace(
-        /const AGENT_CAPABILITIES = \[\s*([^]*?)\s*\];/s,
-        `const AGENT_CAPABILITIES = [\n${capsString}\n];`
-      );
-    }
-  }
-  
-  // Upewnij się, że jest ograniczenie czasu działania
-  if (!templateContent.includes("MAX_RUNTIME")) {
-    const runtimeCode = `\n// KRYTYCZNE - ograniczenie czas
u działania\nlet runtime = 0;\nconst MAX_RUNTIME = 60000; //
 60 sekund\nconst CHECK_INTERVAL = 3000; // 3 sekundy\n`;
-    
-    // Dodaj przed główną pętlą
-    templateContent = templateContent.replace(/while\s*\(.*
?\)\s*{/s, 
-      (match) => `${runtimeCode}\n${match}`);
-    
-    // Upewnij się, że pętla ma ograniczenie czasu
-    templateContent = templateContent.replace(/while\s*\((.
*?)\)\s*{/s, 
-      `while (runtime < MAX_RUNTIME) {`);
-    
-    // Dodaj aktualizację licznika czasu
-    templateContent = templateContent.replace(/\s*\/\/ Pauz
a przed kolejnym sprawdzeniem\s*.*?setTimeout.*?\);/s, 
-      `\n      // Pauza przed kolejnym sprawdzeniem\n      
await new Promise(resolve => setTimeout(resolve, CHECK_INTER
VAL));\n      runtime += CHECK_INTERVAL;`);
-  }
-  
-  // Upewnij się, że jest wyrejestrowywanie agenta przy zak
ończeniu
-  if (!templateContent.includes("deregisterAgent")) {
-    const deregisterCode = `\n\n  // KRYTYCZNE - wyrejestru
j agenta przy zakończeniu\n  console.log("Wyrejestrowywanie 
agenta...");\n  agentApi.deregisterAgent(AGENT_UUID);\n  con
sole.log("Agent wyrejestrowany z systemu.");\n`;
-    
-    // Dodaj przed końcem funkcji głównej
-    templateContent = templateContent.replace(/\}(\s*\/\/ U
ruchom agenta)/s, 
-      `${deregisterCode}}\n$1`);
-  }
-  
-  // Zapisz plik agenta
-  fs.writeFileSync(targetPath, templateContent);
-  console.log(`Agent został utworzony: ${targetPath}`);
-  
-  // Dodaj wykonaj chmod +x
-  try {
-    fs.chmodSync(targetPath, '755');
-  } catch (e) {
-    console.warn('Ostrzeżenie: Nie udało się ustawić uprawn
ień wykonywania dla pliku.');
-  }
-  
-  // Utwórz plik instrukcji
-  const instructionsPath = createInstructionsFile(uuid, age
ntName, agentDescription);
-  
-  console.log('\n=== Agent gotowy do użycia ===');
-  console.log(`UUID: ${uuid}`);
-  console.log(`Plik agenta: ${targetPath}`);
-  if (instructionsPath) {
-    console.log(`Instrukcje: ${instructionsPath}`);
-  }
-  
-  console.log('\nAby uruchomić agenta, wykonaj:');
-  console.log(`  node ${targetPath}`);
-  
-  console.log('\nPo zakończeniu testów, wykonaj polecenie c
zyszczące protokół:');
-  console.log('  node scripts/cleanup-protocol.js');
-  
-  console.log('\nPowodzenia!');
-}
-
-// Uruchom program
-main().catch(err => {
-  console.error('Błąd:', err);
-  process.exit(1);
-});
\ No newline at end of file
diff --git a/scripts/kill-agent.js b/scripts/kill-agent.js
deleted file mode 100644
index 678677f..0000000
--- a/scripts/kill-agent.js
+++ /dev/null
@@ -1,122 +0,0 @@
-/**
- * Script for killing a problematic agent
- * Skrypt do zatrzymania agenta powodującego problemy
- */
-
-const fs = require('fs');
-const path = require('path');
-const agentApi = require('../src/agent-api');
-
-// Ustawienia
-const PROJECT_ROOT = process.cwd();
-const BASE_PATH = path.join(PROJECT_ROOT, '.a2a');
-const MESSAGES_PATH = path.join(BASE_PATH, 'messages');
-const DISCOVERY_PATH = path.join(BASE_PATH, 'discovery');
-
-// Id agenta do zatrzymania
-const AGENT_ID = process.argv[2];
-
-if (!AGENT_ID) {
-  console.error('Błąd: Nie podano ID agenta do zatrzymania.
');
-  console.error('Użycie: node kill-agent.js <agent-id>');
-  process.exit(1);
-}
-
-// Funkcja do wysyłania wiadomości kontrolnej
-function sendControlMessage(agentId) {
-  console.log(`Wysyłanie wiadomości kontrolnej do agenta ${
agentId}...`);
-  
-  // Upewnij się, że ścieżki istnieją
-  if (!fs.existsSync(MESSAGES_PATH)) {
-    fs.mkdirSync(MESSAGES_PATH, { recursive: true });
-  }
-  
-  if (!fs.existsSync(path.join(MESSAGES_PATH, agentId))) {
-    fs.mkdirSync(path.join(MESSAGES_PATH, agentId), { recur
sive: true });
-  }
-  
-  // Tworzymy wiadomość bezpośrednio w katalogu agenta
-  const messageId = Date.now().toString();
-  const message = {
-    message_id: messageId,
-    sender_id: "SYSTEM",
-    sender_name: "Protocol Cleanup",
-    target_id: agentId,
-    timestamp: new Date().toISOString(),
-    message_type: "control",
-    content: {
-      text: "Natychmiastowe zakończenie pracy. Agent powodu
je problemy w protokole.",
-      control_command: "exit_loop",
-      emergency: true,
-      force: true
-    }
-  };
-  
-  // Zapisz w głównym katalogu wiadomości
-  const messagePath = path.join(MESSAGES_PATH, `${messageId
}.json`);
-  fs.writeFileSync(messagePath, JSON.stringify(message, nul
l, 2));
-  
-  // Zapisz w katalogu agenta
-  const agentMessagePath = path.join(MESSAGES_PATH, agentId
, `${messageId}.json`);
-  fs.writeFileSync(agentMessagePath, JSON.stringify(message
, null, 2));
-  
-  console.log('Wiadomość kontrolna wysłana pomyślnie.');
-  
-  // Spróbuj też usunąć tego agenta z discovery
-  const discoveryPath = path.join(DISCOVERY_PATH, `${agentI
d}.json`);
-  if (fs.existsSync(discoveryPath)) {
-    try {
-      fs.unlinkSync(discoveryPath);
-      console.log(`Usunięto kartę agenta z discovery: ${age
ntId}`);
-    } catch (e) {
-      console.error(`Błąd podczas usuwania karty agenta: ${
e.message}`);
-    }
-  }
-  
-  // Usuń wszystkie wiadomości tego agenta
-  try {
-    console.log('Usuwanie wszystkich wiadomości od tego age
nta...');
-    
-    const files = fs.readdirSync(MESSAGES_PATH)
-      .filter(f => f.endsWith('.json'))
-      .map(f => path.join(MESSAGES_PATH, f));
-    
-    for (const file of files) {
-      try {
-        const content = fs.readFileSync(file, 'utf8');
-        const message = JSON.parse(content);
-        
-        if (message.sender_id === agentId || message.target
_id === agentId) {
-          fs.unlinkSync(file);
-        }
-      } catch (e) {
-        // Ignoruj błędne pliki
-      }
-    }
-    
-    // Usuń cały katalog wiadomości agenta
-    const agentDir = path.join(MESSAGES_PATH, agentId);
-    if (fs.existsSync(agentDir)) {
-      const dirFiles = fs.readdirSync(agentDir);
-      for (const file of dirFiles) {
-        fs.unlinkSync(path.join(agentDir, file));
-      }
-      fs.rmdirSync(agentDir);
-      console.log(`Usunięto katalog wiadomości agenta: ${ag
entId}`);
-    }
-    
-  } catch (e) {
-    console.error(`Błąd podczas czyszczenia wiadomości: ${e
.message}`);
-  }
-  
-  console.log('Zakończono czyszczenie protokołu po agencie.
');
-}
-
-// Główna funkcja
-function main() {
-  console.log(`Próba zatrzymania agenta: ${AGENT_ID}`);
-  sendControlMessage(AGENT_ID);
-}
-
-// Uruchom program
-main();
\ No newline at end of file
diff --git a/scripts/refactor-cleanup.sh b/scripts/refactor-
cleanup.sh
new file mode 100644
index 0000000..a44e1ac
--- /dev/null
+++ b/scripts/refactor-cleanup.sh
@@ -0,0 +1,90 @@
+#!/usr/bin/env bash
+# refactor-cleanup.sh — ONE-SHOT hyperscaler-style repo cle
anup
+# ---------------------------------------------------------
---
+# 1. Creates a new git branch (refactor/clean-<date>)
+# 2. Creates a full backup copy (../lbrxAgents_backup_<time
stamp>)
+# 3. Performs safe removal / move of duplicate & deprecated
 files
+# 4. Logs all operations to SPRZATANIE_LOG.txt
+#
+# Usage:  bash scripts/refactor-cleanup.sh [--dry-run]
+# ---------------------------------------------------------
---
+set -euo pipefail
+
+DRY_RUN=false
+if [[ "$*" == *--dry-run* ]]; then
+  DRY_RUN=true
+  echo "[DRY-RUN] No changes on disk — commands only printe
d."
+fi
+
+# --- Vars ---
+REPO_ROOT="$(git rev-parse --show-toplevel)"
+TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
+BRANCH="refactor/clean-${TIMESTAMP}"
+BACKUP_DIR="${REPO_ROOT}/../lbrxAgents_backup_${TIMESTAMP}"
+LOG_FILE="${REPO_ROOT}/SPRZATANIE_LOG_${TIMESTAMP}.txt"
+
+log() {
+  echo "[$(date +%T)] $*" | tee -a "$LOG_FILE"
+}
+
+cmd() {
+  if $DRY_RUN; then
+    log "DRY-RUN: $*"
+  else
+    log "RUN  : $*"
+    eval "$*"
+  fi
+}
+
+# --- 1. Git branch ---
+log "Creating new git branch $BRANCH"
+cmd "git checkout -b $BRANCH"
+
+# --- 2. Backup ---
+log "Creating rsync backup at $BACKUP_DIR (excludes .git)"
+cmd "rsync -a --exclude '.git' --delete --progress \"$REPO_
ROOT/\" \"$BACKUP_DIR/\""
+
+# --- 3. Cleanup operations ---
+# Duplicate agent-api.js in root → remove (keep src/agent-a
pi.js)
+if [[ -f "$REPO_ROOT/agent-api.js" ]]; then
+  log "Removing duplicate root agent-api.js (kept in src/)"
+  cmd "git rm -f $REPO_ROOT/agent-api.js"
+fi
+
+# Remove deprecated scripts
+DEPRECATED_SCRIPTS=(
+  "scripts/create-agent.sh"
+  "scripts/initialize-agent.js"
+  "scripts/kill-agent.js"
+  "scripts/deep-clean.js"
+)
+for f in "${DEPRECATED_SCRIPTS[@]}"; do
+  if [[ -e "$REPO_ROOT/$f" ]]; then
+    log "Removing deprecated $f"
+    cmd "git rm -rf $REPO_ROOT/$f"
+  fi
+done
+
+# Consolidate utils/ into src/utils/ (if top-level utils ex
ists)
+if [[ -d "$REPO_ROOT/utils" ]]; then
+  log "Moving top-level utils/ into src/utils/"
+  cmd "mkdir -p $REPO_ROOT/src/utils"
+  cmd "git mv $REPO_ROOT/utils/* $REPO_ROOT/src/utils/"
+  cmd "git rm -rf $REPO_ROOT/utils"
+fi
+
+# Remove empty directories left behind
+log "Removing empty dirs"
+cmd "find $REPO_ROOT -type d -empty -not -path '*/.git*' -d
elete"
+
+# --- 4. Commit & summary ---
+log "Git add & commit"
+cmd "git add -A"
+cmd "git commit -m 'refactor(repo): initial cleanup — remov
e duplicates, deprecated scripts, utils consolidation'"
+
+log "Cleanup done. Review changes with: git diff main...$BR
ANCH"
+log "Full log written to $LOG_FILE"
+
+if $DRY_RUN; then
+  log "DRY-RUN finished — no commits done."
+fi 
\ No newline at end of file
diff --git a/src/api/agent-api.js b/src/api/agent-api.js
deleted file mode 100644
index eef6cc6..0000000
--- a/src/api/agent-api.js
+++ /dev/null
@@ -1,2 +0,0 @@
-// Shim file: new location for agent API re-exporting exist
ing implementation
-export * from '../agent-api.js'; 
\ No newline at end of file
(END)
```