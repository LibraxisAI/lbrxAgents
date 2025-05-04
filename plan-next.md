# Ultimate AI Developer Environment: Vibecoding w Duchu lbrxAgents

## Struktura katalogów projektu

Bazując na duchu projektu LibraxisAI/lbrxAgents, proponuję następującą strukturę katalogów:

```
project-root/
├── src/                          # Główny kod źródłowy
│   ├── agents/                   # Katalog z agentami AI
│   │   ├── sequential-thinking/  # Agent do sekwencyjnego myślenia
│   │   ├── dev-agent/           # Agent programistyczny
│   │   ├── review-agent/        # Agent do code review
│   │   ├── test-agent/          # Agent do testowania
│   │   └── orchestrator/        # Koordynator pracy agentów
│   │
│   ├── api/                      # Interfejsy API i komunikacja
│   │   ├── mcp-connector.js      # Łącznik do MCP
│   │   ├── memory-api.js         # API do zarządzania pamięcią projektu
│   │   └── messaging.js          # System komunikacji między agentami
│   │
│   ├── memory/                   # System pamięci projektu
│   │   ├── vector-store/         # Przechowywanie wektorów dla ChromaDB
│   │   ├── snapshots/            # Automatyczne snapshoty projektu
│   │   └── context-manager.js    # Zarządzanie kontekstem projektu
│   │
│   └── utils/                    # Narzędzia wspólne
│       ├── semgrep-scanner.js    # Integracja z Semgrep
│       └── tree-monitor.js       # Monitorowanie struktury projektu
│
├── templates/                    # Szablony dla agentów i komponentów
│   ├── agent-template.js         # Podstawowy szablon agenta
│   ├── orchestrator-template.js  # Szablon dla orchestratora
│   └── project-memory.js         # Szablon dla pamięci projektu
│
├── config/                       # Konfiguracje
│   ├── mcp-servers.json          # Konfiguracja serwerów MCP
│   ├── zsh/                      # Konfiguracja ZSH
│   │   ├── .zshrc                # Główna konfiguracja ZSH
│   │   └── aliases.zsh           # Aliasy dla ZSH
│   │
│   ├── warp/                     # Konfiguracja terminala WARP
│   │   └── themes/               # Motywy dla WARP
│   │
│   └── cursor/                   # Konfiguracja edytora Cursor
│       ├── settings.json         # Ustawienia Cursor
│       └── keybindings.json      # Mapowanie klawiszy
│
├── scripts/                      # Skrypty automatyzujące
│   ├── setup-env.sh              # Konfiguracja środowiska
│   ├── local-snapshot.sh         # Tworzenie lokalnych snapshotów
│   ├── cloud-backup.sh           # Tworzenie kopii zapasowych w chmurze
│   └── init-agent.js             # Inicjalizacja nowego agenta
│
├── memory-bank/                  # Bank pamięci projektu
│   ├── core/                     # Podstawowe informacje o projekcie
│   ├── architecture/             # Dokumentacja architektury
│   ├── decisions/                # Rejestr decyzji projektowych
│   └── knowledge/                # Baza wiedzy specyficzna dla projektu
│
├── docs/                         # Dokumentacja
│   ├── guides/                   # Przewodniki
│   ├── best-practices/           # Najlepsze praktyki
│   └── workflows/                # Przepływy pracy
│
└── examples/                     # Przykłady użycia
    ├── simple-agent.js           # Przykład prostego agenta
    ├── multi-agent-workflow.js   # Przykład przepływu pracy wielu agentów
    └── memory-example.js         # Przykład użycia pamięci projektu
```

## 1. Konfiguracja MCP Servers

### 1.1 Sequential-Thinking Server

```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"],
      "env": {}
    }
  }
}
```

### 1.2 Pamięć projektu (Memory MCP Server)

```json
{
  "mcpServers": {
    "memory": {
      "command": "python",
      "args": ["-m", "mcp_memory_service"],
      "env": {
        "MCP_MEMORY_CHROMA_PATH": "~/Library/Application Support/mcp-memory/chroma_db",
        "MCP_MEMORY_BACKUPS_PATH": "~/Library/Application Support/mcp-memory/backups",
        "EMBEDDING_MODEL": "all-MiniLM-L6-v2",
        "VECTOR_DIMENSION": "384",
        "DEVICE": "cpu"
      }
    }
  }
}
```

### 1.3 Brave-Search Server

```json
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": {
        "BRAVE_API_KEY": "YOUR_API_KEY_HERE"
      }
    }
  }
}
```

### 1.4 Semgrep Server (dla jakości kodu)

```json
{
  "mcpServers": {
    "semgrep": {
      "command": "uvx",
      "args": ["semgrep-mcp"],
      "env": {
        "SEMGREP_APP_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

## 2. Konfiguracja terminala

### 2.1 Konfiguracja ZSH

```bash
# Path to oh-my-zsh installation
export ZSH="$HOME/.oh-my-zsh"

# Set plugins
plugins=(
  git z docker npm python rust golang fzf
  zsh-autosuggestions zsh-syntax-highlighting
)

# Source Oh My Zsh
source $ZSH/oh-my-zsh.sh

# Enable Starship prompt
eval "$(starship init zsh)"

# History settings
HISTFILE=~/.zsh_history
HISTSIZE=10000
SAVEHIST=10000
setopt appendhistory share_history hist_ignore_all_dups hist_ignore_space

# Projekt MCP - aliasy
alias mcp-start="node scripts/start-mcp-servers.js"
alias mcp-monitor="node scripts/monitor-agents.js"
alias mcp-list="node scripts/list-agents.js"
alias mcp-create="node scripts/create-agent.js"
```

### 2.2 Starship prompt (.config/starship.toml)

```toml
# ~/.config/starship.toml

[character]
success_symbol = "[λ](bold green)"
error_symbol = "[λ](bold red)"

[directory]
truncation_length = 3
truncate_to_repo = true

[git_branch]
symbol = "🌱 "
truncation_length = 20
truncation_symbol = ""

[git_status]
conflicted = "⚔️ "
ahead = "🏎️💨 ×${count}"
behind = "🐢 ×${count}"
diverged = "🔱 🏎️💨 ×${ahead_count} 🐢 ×${behind_count}"
untracked = "🛤️  ×${count}"
stashed = "📦 "
modified = "📝 ×${count}"
staged = "🗃️  ×${count}"
renamed = "📛 ×${count}"
deleted = "🗑️  ×${count}"

[nodejs]
symbol = "⬢ "
```

## 3. Konfiguracja Cursor

### 3.1 settings.json

```json
{
  "editor.formatOnSave": true,
  "editor.linkedEditing": true,
  "editor.cursorSmoothCaretAnimation": "on",
  "editor.guides.bracketPairs": true,
  "editor.minimap.enabled": false,
  
  "cursor.showTabCompletions": true,
  "cursor.codebase.indexNewFoldersByDefault": true,
  "cursor.completion.acceptCompletionOnTab": true,
  "cursor.copilotPlusPlus.enabled": true,
  "cursor.features.agent.makeEditsInPlace": true,
  
  "files.autoSave": "afterDelay",
  "files.autoSaveDelay": 1000,
  
  "terminal.integrated.fontFamily": "MesloLGS NF",
  "terminal.integrated.defaultProfile.osx": "zsh",
  
  "cursor.memory.limitFileSize": true,
  "cursor.memory.maxFileSize": 5
}
```

### 3.2 Reguły dla AI (.cursorrules)

```
// Reguły dla TypeScript/Next.js
Zawsze używaj TypeScript dla bezpieczeństwa typów
Implementuj odpowiednie granice błędów
Używaj komponentów funkcyjnych zamiast klasowych
Minimalizuj liczbę re-renderów używając useMemo i useCallback

// Reguły dla Pythona
Zawsze używaj podpowiedzi typów w definicjach funkcji w Pythonie
Stosuj standardy PEP 8 dla kodu Python
Używaj dataclasses gdy to możliwe
Pisz czytelne testy, używając pytest

// Ogólne zasady
Pisz szczegółowe docstrings/komentarze dla wszystkich funkcji
Stosuj zasady DRY (Don't Repeat Yourself)
Projektuj z myślą o testowalności
Zawsze stosuj formatowanie zgodne z konwencją projektu
```

## 4. Skrypty automatyzacji

### 4.1 Automatyczne snapshoty lokalne (scripts/local-snapshot.sh)

```bash
#!/bin/bash
# Create a new snapshot
tmutil localsnapshot / 

# Manage snapshots (keep 24 hours worth - 288 snapshots)
CURRENT_SNAPSHOTS=$(tmutil listlocalsnapshots / | wc -l)
MAX_SNAPSHOTS=288

if [ $CURRENT_SNAPSHOTS -gt $MAX_SNAPSHOTS ]; then
  SNAPSHOTS_TO_DELETE=$((CURRENT_SNAPSHOTS - MAX_SNAPSHOTS))
  OLDEST_SNAPSHOTS=$(tmutil listlocalsnapshots / | head -n $SNAPSHOTS_TO_DELETE)
  
  for SNAPSHOT in $OLDEST_SNAPSHOTS; do
    tmutil deletelocalsnapshots $SNAPSHOT
  done
fi

# Log snapshot creation
echo "Snapshot created at $(date)" >> ~/Library/Logs/project-snapshots.log
```

### 4.2 Skrypt inicjalizujący środowisko (scripts/setup-env.sh)

```bash
#!/bin/bash
# Set up development environment

# Create necessary directories
mkdir -p ~/Workspace/logs ~/scripts memory-bank/{core,architecture,decisions,knowledge}

# Install essential tools
brew install --cask warp
sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)"
curl -sS https://starship.rs/install.sh | sh

# Install ZSH plugins
git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions
git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting
brew install fzf
$(brew --prefix)/opt/fzf/install

# Set up Vector DB for memory
pip install chromadb sentence-transformers

# Setup monitoring scripts
chmod +x scripts/local-snapshot.sh
chmod +x scripts/cloud-backup.sh

# Create launchd job for automatic snapshots
cat > ~/Library/LaunchAgents/com.dev.local-snapshot.plist << EOL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.dev.local-snapshot</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>${PWD}/scripts/local-snapshot.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>300</integer>
</dict>
</plist>
EOL

launchctl load ~/Library/LaunchAgents/com.dev.local-snapshot.plist

echo "Development environment setup complete!"
```

## 5. Implementacja pamięci projektu

### 5.1 Inicjalizacja ChromaDB (memory/vector-store/init.js)

```javascript
const { ChromaClient } = require('chromadb');
const path = require('path');
const fs = require('fs');

// Ścieżka do bazy danych ChromaDB
const CHROMA_PATH = path.join(process.env.HOME, 'Library', 'Application Support', 'mcp-memory', 'chroma_db');

// Upewnij się, że katalog istnieje
if (!fs.existsSync(CHROMA_PATH)) {
  fs.mkdirSync(CHROMA_PATH, { recursive: true });
}

// Utwórz klienta ChromaDB
const client = new ChromaClient(CHROMA_PATH);

// Utwórz kolekcję dla pamięci projektu
async function initializeMemory() {
  try {
    // Sprawdź, czy kolekcja już istnieje
    const collections = await client.listCollections();
    if (!collections.includes('project_memory')) {
      await client.createCollection({
        name: 'project_memory',
        metadata: { "hnsw:space": "cosine" }
      });
      console.log('Utworzono kolekcję pamięci projektu.');
    } else {
      console.log('Kolekcja pamięci projektu już istnieje.');
    }
  } catch (error) {
    console.error('Błąd podczas inicjalizacji pamięci:', error);
  }
}

module.exports = {
  client,
  initializeMemory
};
```

### 5.2 Struktura Memory Bank

```
memory-bank/
├── core/
│   ├── 00-project-overview.md       # Ogólny opis projektu
│   ├── 01-architecture.md           # Architektura systemu
│   └── 02-key-components.md         # Kluczowe komponenty
├── architecture/
│   ├── frontend.md                  # Architektura front-endu
│   └── backend.md                   # Architektura back-endu
├── decisions/
│   ├── 001-choice-of-database.md    # Decyzja o wyborze bazy danych
│   └── 002-authentication-flow.md   # Decyzja o przepływie uwierzytelniania
└── knowledge/
    ├── apis.md                      # Dokumentacja API
    ├── data-models.md               # Modele danych
    └── workflows.md                 # Przepływy pracy
```

## 6. Integracja Sequential Thinking

### 6.1 Implementacja procesu Sequential Thinking

```javascript
// src/agents/sequential-thinking/index.js
const agentApi = require('../../api/mcp-connector');
const memoryApi = require('../../api/memory-api');

class SequentialThinkingAgent {
  constructor(taskDescription) {
    this.taskDescription = taskDescription;
    this.thoughts = [];
    this.currentThought = 1;
    this.totalThoughts = 10; // Początkowa estymacja
    this.needsMoreThoughts = false;
  }

  async think() {
    console.log(`Rozpoczynam proces sequential thinking dla zadania: ${this.taskDescription}`);
    
    // Początkowa myśl
    const firstThought = {
      thought_number: 1,
      thought: `Analizuję zadanie: ${this.taskDescription}`,
      next_thought_needed: true,
      total_thoughts: this.totalThoughts,
      is_revision: false
    };
    
    this.thoughts.push(firstThought);
    await this.processThought(firstThought);
    
    // Kontynuuj myślenie, dopóki potrzebne
    while (this.thoughts[this.thoughts.length - 1].next_thought_needed) {
      await this.nextThought();
    }
    
    return this.generateSummary();
  }
  
  async nextThought() {
    this.currentThought++;
    
    // Sprawdź, czy potrzebujemy więcej myśli niż początkowo zakładaliśmy
    if (this.currentThought > this.totalThoughts) {
      this.totalThoughts = this.currentThought;
      this.needsMoreThoughts = true;
    }
    
    const newThought = {
      thought_number: this.currentThought,
      thought: await this.generateNextThought(),
      next_thought_needed: this.currentThought < this.totalThoughts,
      total_thoughts: this.totalThoughts,
      is_revision: false,
      needs_more_thoughts: this.needsMoreThoughts
    };
    
    this.thoughts.push(newThought);
    await this.processThought(newThought);
    
    return newThought;
  }
  
  async generateNextThought() {
    // W rzeczywistej implementacji, tutaj byłoby wywołanie Claude lub GPT
    // Używając historii myśli do generowania kolejnej
    
    // Symulacja wywołania AI
    return `Kontynuacja analizy dla kroku ${this.currentThought}...`;
  }
  
  async processThought(thought) {
    // Zapisz myśl w pamięci projektu
    await memoryApi.storeThought(thought);
    
    // Wywołaj odpowiednie akcje na podstawie myśli
    // Np. wykonanie kodu, zapisanie decyzji, itp.
    
    console.log(`Myśl #${thought.thought_number}: ${thought.thought}`);
  }
  
  generateSummary() {
    // Generuj podsumowanie procesu myślowego
    return {
      task: this.taskDescription,
      thoughts: this.thoughts,
      conclusion: this.thoughts[this.thoughts.length - 1].thought
    };
  }
}

module.exports = SequentialThinkingAgent;
```

## 7. Workflow Vibecoding

### 7.1 Przykładowy workflow z wieloma agentami

```javascript
// examples/multi-agent-workflow.js
const { OrchestratorAgent } = require('../src/agents/orchestrator');
const { DevAgent } = require('../src/agents/dev-agent');
const { ReviewAgent } = require('../src/agents/review-agent');
const { TestAgent } = require('../src/agents/test-agent');
const memoryApi = require('../src/api/memory-api');

async function startVibecoding() {
  console.log("Rozpoczynam workflow Vibecoding...");
  
  // Inicjalizacja pamięci projektu
  await memoryApi.initialize();
  
  // Stwórz agentów
  const orchestrator = new OrchestratorAgent({
    projectName: "Mój Projekt",
    description: "Projekt wykorzystujący Vibecoding i A2A"
  });
  
  const developer = new DevAgent({
    name: "DevAgent",
    capabilities: ["TypeScript", "React", "Node.js"]
  });
  
  const reviewer = new ReviewAgent({
    name: "ReviewAgent",
    capabilities: ["Code Review", "Best Practices", "Security"]
  });
  
  const tester = new TestAgent({
    name: "TestAgent",
    capabilities: ["Unit Testing", "Integration Testing", "E2E Testing"]
  });
  
  // Zarejestruj agentów w orchestratorze
  orchestrator.registerAgent(developer);
  orchestrator.registerAgent(reviewer);
  orchestrator.registerAgent(tester);
  
  // Rozpocznij workflow
  await orchestrator.startWorkflow({
    task: "Stwórz komponent React wyświetlający dane z API",
    steps: [
      {
        name: "design",
        description: "Zaprojektuj strukturę komponentu",
        assignedTo: "DevAgent"
      },
      {
        name: "implement",
        description: "Zaimplementuj komponent",
        assignedTo: "DevAgent"
      },
      {
        name: "review",
        description: "Przeprowadź code review",
        assignedTo: "ReviewAgent"
      },
      {
        name: "test",
        description: "Napisz testy dla komponentu",
        assignedTo: "TestAgent"
      },
      {
        name: "finalize",
        description: "Finalizacja i dokumentacja",
        assignedTo: "DevAgent"
      }
    ]
  });
  
  console.log("Workflow Vibecoding zakończony!");
}

startVibecoding().catch(console.error);
```

## 8. Zapewnienie jakości kodu

### 8.1 Integracja Semgrep (utils/semgrep-scanner.js)

```javascript
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class SemgrepScanner {
  constructor(options = {}) {
    this.options = {
      rules: options.rules || '@security',
      outputFormat: options.outputFormat || 'json',
      targetPath: options.targetPath || '.',
      configPath: options.configPath || null
    };
    
    // Sprawdź, czy Semgrep jest zainstalowany
    try {
      execSync('semgrep --version', { stdio: 'ignore' });
    } catch (error) {
      throw new Error('Semgrep nie jest zainstalowany. Zainstaluj go używając "pip install semgrep"');
    }
  }
  
  scan() {
    let command = `semgrep --${this.options.outputFormat} `;
    
    if (this.options.configPath) {
      command += `--config ${this.options.configPath} `;
    } else {
      command += `--${this.options.rules} `;
    }
    
    command += this.options.targetPath;
    
    try {
      const result = execSync(command, { encoding: 'utf-8' });
      
      if (this.options.outputFormat === 'json') {
        return JSON.parse(result);
      }
      
      return result;
    } catch (error) {
      // Semgrep zwraca kod błędu 1 gdy znajdzie problemy
      if (error.status === 1 && error.stdout) {
        const result = error.stdout.toString();
        
        if (this.options.outputFormat === 'json') {
          return JSON.parse(result);
        }
        
        return result;
      }
      
      throw error;
    }
  }
  
  generateReport(scanResults) {
    const findings = scanResults.results || [];
    const totalFindings = findings.length;
    
    const report = {
      summary: {
        total: totalFindings,
        byRuleId: {},
        bySeverity: {}
      },
      findings: findings
    };
    
    // Grupuj wyniki według reguł i poziomu ważności
    findings.forEach(finding => {
      const ruleId = finding.check_id;
      const severity = finding.extra.severity || 'unknown';
      
      report.summary.byRuleId[ruleId] = (report.summary.byRuleId[ruleId] || 0) + 1;
      report.summary.bySeverity[severity] = (report.summary.bySeverity[severity] || 0) + 1;
    });
    
    return report;
  }
  
  async scanAndReport() {
    const scanResults = this.scan();
    const report = this.generateReport(scanResults);
    
    console.log(`Semgrep znalazł ${report.summary.total} problemów.`);
    
    if (report.summary.total > 0) {
      console.log('\nPodsumowanie według ważności:');
      Object.entries(report.summary.bySeverity).forEach(([severity, count]) => {
        console.log(`  ${severity}: ${count}`);
      });
      
      console.log('\nPodsumowanie według reguł:');
      Object.entries(report.summary.byRuleId).forEach(([ruleId, count]) => {
        console.log(`  ${ruleId}: ${count}`);
      });
    }
    
    return report;
  }
}

module.exports = SemgrepScanner;
```

## 9. System monitorowania struktury projektu

### 9.1 Monitorowanie drzewa projektu (utils/tree-monitor.js)

```javascript
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const memoryApi = require('../api/memory-api');

class TreeMonitor {
  constructor(options = {}) {
    this.options = {
      projectRoot: options.projectRoot || process.cwd(),
      outputDir: options.outputDir || path.join(process.cwd(), 'memory-bank', 'core'),
      depth: options.depth || 3,
      exclude: options.exclude || ['node_modules', '.git', 'dist', 'build'],
      updateInterval: options.updateInterval || 60 * 1000 // 1 minuta
    };
    
    this.lastTreeStructure = null;
    this.intervalId = null;
  }
  
  generateTree() {
    const excludePattern = this.options.exclude.map(dir => `-not -path "*/${dir}/*"`).join(' ');
    
    try {
      // Użyj find do generowania drzewa katalogów z wyłączeniami
      const command = `find ${this.options.projectRoot} -type d -not -path "*/\\.*" ${excludePattern} | sort | sed 's|[^/]*/|  |g'`;
      const treeOutput = execSync(command, { encoding: 'utf8' });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const outputFile = path.join(this.options.outputDir, `tree_structure_${timestamp}.txt`);
      
      fs.writeFileSync(outputFile, treeOutput);
      
      // Zapisz w pamięci projektu
      memoryApi.storeProjectStructure({
        timestamp,
        structure: treeOutput
      });
      
      this.lastTreeStructure = treeOutput;
      
      return {
        timestamp,
        structure: treeOutput,
        file: outputFile
      };
    } catch (error) {
      console.error('Błąd podczas generowania drzewa projektu:', error);
      throw error;
    }
  }
  
  detectChanges() {
    const currentTree = this.generateTree();
    
    if (this.lastTreeStructure && this.lastTreeStructure !== currentTree.structure) {
      console.log('Wykryto zmiany w strukturze projektu!');
      
      // Zapisz informację o zmianie w pamięci projektu
      memoryApi.storeEvent({
        type: 'structure_change',
        timestamp: new Date().toISOString(),
        details: 'Zmiana struktury projektu'
      });
      
      return true;
    }
    
    return false;
  }
  
  startMonitoring() {
    console.log('Rozpoczynam monitorowanie struktury projektu...');
    
    // Generuj początkowe drzewo
    this.generateTree();
    
    // Ustaw interwał monitowania
    this.intervalId = setInterval(() => {
      this.detectChanges();
    }, this.options.updateInterval);
    
    return this;
  }
  
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Zatrzymano monitorowanie struktury projektu.');
    }
  }
}

module.exports = TreeMonitor;
```

To zoptymalizowane środowisko developerskie integruje wszystkie wymagane komponenty i jest zgodne z duchem projektu lbrxAgents. Struktura wspiera pracę wielu agentów AI z pamięcią projektu, wykorzystuje Sequential Thinking i zapewnia automatyzację wielu procesów.