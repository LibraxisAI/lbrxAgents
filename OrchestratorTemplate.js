/**
 * Orkiestrator A2A - szablon
 * 
 * Odpowiada za koordynację pracy zespołu agentów
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const agentApi = require('./agent-api');

// ====================================
// KONFIGURACJA ORKIESTRATORA
// ====================================

const ORCHESTRATOR_UUID = process.env.ORCHESTRATOR_UUID || generateOrchestratorId();
const ORCHESTRATOR_NAME = "Orchestrator";
const ORCHESTRATOR_DESCRIPTION = "Agent koordynujący prace zespołu agentów w projekcie";
const ORCHESTRATOR_CAPABILITIES = [
  "orchestration",
  "coordination",
  "task_assignment",
  "status_tracking"
];

// Konfiguracja projektu
const PROJECT = {
  name: "QuantumScout",
  description: "Wieloagentowy system rekrutacyjny",
  version: "1.0.0",
  status: "in_progress"
};

// Struktura agentów i ich zadań
let teamAgents = {};
let taskAssignments = {};
let agentStatus = {};

// ====================================
// FUNKCJE ORKIESTRATORA
// ====================================

/**
 * Obsługa otrzymanej wiadomości
 * @param {object} message - Obiekt wiadomości
 * @returns {object|null} - Opcjonalna odpowiedź
 */
async function handleMessage(message) {
  console.log(`Otrzymano wiadomość od: ${message.sender_name} (${message.sender_id})`);
  console.log(`Typ: ${message.message_type}`);
  
  // Aktualizuj status agenta
  updateAgentStatus(message.sender_id, 'active', message.sender_name);
  
  // Przykład obsługi różnych typów wiadomości
  switch (message.message_type) {
    case 'query':
      return handleQuery(message);
      
    case 'notification':
      return handleNotification(message);
      
    case 'announcement':
      return handleAnnouncement(message);
      
    case 'status_update':
      return handleStatusUpdate(message);
      
    case 'task_request':
      return handleTaskRequest(message);
      
    case 'task_completion':
      return handleTaskCompletion(message);
      
    case 'control':
      return handleControlMessage(message);
      
    default:
      console.log(`Nieobsługiwany typ wiadomości: ${message.message_type}`);
      return null;
  }
}

/**
 * Obsługa zapytania
 */
function handleQuery(message) {
  const { content } = message;
  
  if (content.query_type === 'team_status') {
    return {
      text: "Status zespołu agentów",
      team_status: getCurrentTeamStatus(),
      project_status: PROJECT
    };
  } else if (content.query_type === 'orchestrator_status') {
    return {
      text: "Status orkiestratora",
      orchestrator_status: {
        status: "active",
        agents_count: Object.keys(teamAgents).length,
        tasks_count: Object.keys(taskAssignments).length
      }
    };
  } else if (content.query_type === 'tasks') {
    return {
      text: "Przydzielone zadania",
      tasks: getAgentTasks(message.sender_id)
    };
  }
  
  return {
    text: "Otrzymałem zapytanie, ale nie rozpoznaję jego typu",
    status: "unknown_query"
  };
}

/**
 * Obsługa powiadomienia
 */
function handleNotification(message) {
  const { content } = message;
  
  if (content.deregistration) {
    // Agent zgłasza wyrejestrowanie
    const agentId = content.agent_id;
    console.log(`Agent ${agentId} został wyrejestrowany`);
    
    if (teamAgents[agentId]) {
      updateAgentStatus(agentId, 'inactive');
      
      // Przepisz zadania do innych agentów
      reassignTasks(agentId);
    }
  }
  
  // Zwykle nie odpowiadamy na powiadomienia
  return null;
}

/**
 * Obsługa ogłoszenia (np. dołączenie nowego agenta)
 */
function handleAnnouncement(message) {
  const { content } = message;
  
  if (content.announcement && content.agent_details) {
    const { id, name, capabilities, description } = content.agent_details;
    console.log(`Nowy agent dołącza do systemu: ${name} (${id})`);
    
    // Dodaj agenta do zespołu
    teamAgents[id] = {
      id,
      name,
      capabilities: capabilities || [],
      description: description || '',
      added_at: new Date().toISOString()
    };
    
    // Ustaw status agenta jako aktywny
    updateAgentStatus(id, 'active', name);
    
    // Przywitaj nowego agenta i przydziel początkowe zadania
    setTimeout(() => {
      welcomeNewAgent(id, name);
    }, 1000);
    
    // Zaktualizuj globalny status projektu
    updateProjectStatus();
  }
  
  return null;
}

/**
 * Obsługa aktualizacji statusu
 */
function handleStatusUpdate(message) {
  const { content } = message;
  
  if (content.status) {
    updateAgentStatus(message.sender_id, content.status, message.sender_name);
    
    if (content.task_id && content.task_status) {
      updateTaskStatus(message.sender_id, content.task_id, content.task_status);
    }
  }
  
  return {
    text: "Status zaktualizowany",
    status: "acknowledged"
  };
}

/**
 * Obsługa prośby o zadanie
 */
function handleTaskRequest(message) {
  const { content } = message;
  
  // Sprawdź kompetencje agenta
  const agent = teamAgents[message.sender_id];
  if (!agent) {
    return {
      text: "Nie jesteś zarejestrowanym agentem w systemie",
      status: "error",
      error: "agent_not_registered"
    };
  }
  
  // Przydziel zadanie na podstawie kompetencji
  const task = assignTaskBasedOnCapabilities(agent);
  
  if (task) {
    return {
      text: `Przydzielono zadanie: ${task.title}`,
      task
    };
  } else {
    return {
      text: "Brak dostępnych zadań do przydzielenia",
      status: "no_tasks"
    };
  }
}

/**
 * Obsługa zakończenia zadania
 */
function handleTaskCompletion(message) {
  const { content } = message;
  
  if (content.task_id && content.results) {
    markTaskAsCompleted(message.sender_id, content.task_id, content.results);
    
    return {
      text: "Zadanie oznaczone jako zakończone",
      status: "success"
    };
  }
  
  return {
    text: "Nie można zakończyć zadania - brak wymaganych informacji",
    status: "error"
  };
}

/**
 * Obsługa wiadomości kontrolnej
 */
function handleControlMessage(message) {
  const { content } = message;
  
  if (content.control_command === 'exit_loop') {
    console.log("Otrzymano polecenie zakończenia pętli orkiestratora");
    agentApi.requestShutdown();
  } else if (content.control_command === 'reset_status') {
    resetSystemStatus();
    return {
      text: "Status systemu zresetowany",
      status: "success"
    };
  }
  
  return null;
}

/**
 * Przywitaj nowego agenta i przydziel początkowe zadania
 */
function welcomeNewAgent(agentId, agentName) {
  // Wyślij wiadomość powitalną
  agentApi.sendMessage(agentId, {
    text: `Witaj ${agentName} w projekcie ${PROJECT.name}!`,
    project_info: PROJECT,
    team_status: getCurrentTeamStatus()
  }, 'welcome');
  
  // Wyślij pliki instrukcji
  sendInstructionsToAgent(agentId);
  
  // Przydziel początkowe zadania
  const initialTasks = getInitialTasksForAgent(agentId);
  if (initialTasks.length > 0) {
    agentApi.sendMessage(agentId, {
      text: "Oto Twoje początkowe zadania",
      tasks: initialTasks
    }, 'task_assignment');
  }
}

/**
 * Wyślij instrukcje do agenta
 */
function sendInstructionsToAgent(agentId) {
  const agent = teamAgents[agentId];
  if (!agent) return;
  
  // Utwórz plik instrukcji dla agenta
  const instructionsPath = path.join(agentApi.ORCHESTRATOR_PATH, `${agentId}_instructions.json`);
  const instructions = {
    agent_id: agentId,
    agent_name: agent.name,
    role: "Członek zespołu projektowego",
    project: PROJECT,
    objectives: [
      "Współpraca z innymi agentami",
      "Realizacja przydzielonych zadań",
      "Zgłaszanie statusu postępów"
    ],
    communication_guidelines: [
      "Wysyłaj regularne aktualizacje statusu",
      "Informuj o napotkanych problemach",
      "Potwierdzaj otrzymanie zadań"
    ]
  };
  
  fs.writeFileSync(instructionsPath, JSON.stringify(instructions, null, 2));
  
  // Poinformuj agenta o dostępnych instrukcjach
  agentApi.sendMessage(agentId, {
    text: "Dostępne są instrukcje od orkiestratora",
    instructions_available: true
  }, 'notification');
}

/**
 * Aktualizuj status agenta
 */
function updateAgentStatus(agentId, status, agentName) {
  agentStatus[agentId] = {
    status,
    last_update: new Date().toISOString(),
    name: agentName || (teamAgents[agentId] ? teamAgents[agentId].name : 'Unknown')
  };
  
  // Zapisz aktualny status do pliku
  const statusFile = path.join(agentApi.STATUS_PATH, 'agents_status.json');
  fs.writeFileSync(statusFile, JSON.stringify({
    active_agents: agentStatus,
    last_update: new Date().toISOString()
  }, null, 2));
}

/**
 * Aktualizuj status projektu
 */
function updateProjectStatus() {
  // Zapisz aktualny status projektu
  const projectStatusFile = path.join(agentApi.ORCHESTRATOR_PATH, 'project_status.json');
  
  const projectStatus = {
    ...PROJECT,
    team_size: Object.keys(teamAgents).length,
    active_agents: Object.keys(agentStatus).filter(id => agentStatus[id].status === 'active').length,
    tasks_total: Object.keys(taskAssignments).length,
    tasks_completed: Object.values(taskAssignments).filter(task => task.status === 'completed').length,
    updated_at: new Date().toISOString()
  };
  
  fs.writeFileSync(projectStatusFile, JSON.stringify(projectStatus, null, 2));
  
  // Zaktualizuj status orkiestratora
  const orchestratorStatusFile = path.join(agentApi.ORCHESTRATOR_PATH, 'status.json');
  fs.writeFileSync(orchestratorStatusFile, JSON.stringify({
    status: 'active',
    project: PROJECT.name,
    agents_count: Object.keys(teamAgents).length,
    last_update: new Date().toISOString(),
    message: `Projekt ${PROJECT.name} w trakcie realizacji`
  }, null, 2));
}

/**
 * Pobierz aktualny status zespołu
 */
function getCurrentTeamStatus() {
  return {
    agents: Object.values(teamAgents).map(agent => ({
      id: agent.id,
      name: agent.name,
      status: agentStatus[agent.id] ? agentStatus[agent.id].status : 'unknown',
      capabilities: agent.capabilities
    })),
    active_count: Object.keys(agentStatus).filter(id => agentStatus[id].status === 'active').length,
    total_count: Object.keys(teamAgents).length
  };
}

/**
 * Zresetuj status systemu
 */
function resetSystemStatus() {
  // Zresetuj status agentów
  Object.keys(agentStatus).forEach(agentId => {
    if (agentStatus[agentId].status !== 'inactive') {
      agentStatus[agentId].status = 'unknown';
      agentStatus[agentId].last_update = new Date().toISOString();
    }
  });
  
  // Zresetuj zadania
  Object.keys(taskAssignments).forEach(taskId => {
    if (taskAssignments[taskId].status !== 'completed') {
      taskAssignments[taskId].status = 'pending';
    }
  });
  
  // Zaktualizuj pliki statusu
  updateProjectStatus();
}

// ====================================
// ZARZĄDZANIE ZADANIAMI - DOSTOSUJ DO POTRZEB PROJEKTU
// ====================================

/**
 * Pobierz zadania przypisane do agenta
 */
function getAgentTasks(agentId) {
  return Object.values(taskAssignments).filter(task => task.assignee === agentId);
}

/**
 * Przydziel zadanie na podstawie kompetencji
 */
function assignTaskBasedOnCapabilities(agent) {
  // W rzeczywistym systemie tutaj byłaby logika przydzielania zadań
  return null;
}

/**
 * Pobierz początkowe zadania dla agenta
 */
function getInitialTasksForAgent(agentId) {
  // W rzeczywistym systemie tutaj byłaby logika przydzielania początkowych zadań
  return [];
}

/**
 * Oznacz zadanie jako zakończone
 */
function markTaskAsCompleted(agentId, taskId, results) {
  if (taskAssignments[taskId] && taskAssignments[taskId].assignee === agentId) {
    taskAssignments[taskId].status = 'completed';
    taskAssignments[taskId].completed_at = new Date().toISOString();
    taskAssignments[taskId].results = results;
    
    // Zapisz wyniki do pliku
    const resultsPath = path.join(agentApi.ORCHESTRATOR_PATH, 'task_results', `${taskId}.json`);
    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify({
      task_id: taskId,
      agent_id: agentId,
      completed_at: taskAssignments[taskId].completed_at,
      results
    }, null, 2));
    
    // Poinformuj innych agentów o zakończeniu zadania
    notifyTeamAboutTaskCompletion(taskId, agentId);
    
    return true;
  }
  
  return false;
}

/**
 * Przypisz zadania do innych agentów
 */
function reassignTasks(agentId) {
  const agentTasks = getAgentTasks(agentId);
  
  // W rzeczywistym systemie tutaj byłaby logika przepisywania zadań
}

/**
 * Powiadom zespół o zakończeniu zadania
 */
function notifyTeamAboutTaskCompletion(taskId, agentId) {
  const task = taskAssignments[taskId];
  if (!task) return;
  
  const agentName = teamAgents[agentId] ? teamAgents[agentId].name : 'Unknown';
  
  // Powiadom wszystkich aktywnych agentów
  Object.keys(agentStatus)
    .filter(id => id !== agentId && agentStatus[id].status === 'active')
    .forEach(id => {
      agentApi.sendMessage(id, {
        text: `Agent ${agentName} zakończył zadanie: ${task.title}`,
        task_id: taskId,
        task_title: task.title,
        completed_by: agentId
      }, 'notification');
    });
}

// ====================================
// FUNKCJE POMOCNICZE
// ====================================

// Generuje deterministyczny UUID dla orkiestratora
function generateOrchestratorId() {
  const namespace = '6ba7b810-9dad-11d1-80b4-00c04fd430c8';
  return '00000000-0000-0000-0000-000000000001';
}

// ====================================
// INICJALIZACJA ORKIESTRATORA
// ====================================

// Utworzenie karty orkiestratora
function createOrchestratorCard() {
  const cardPath = path.join(__dirname, `${ORCHESTRATOR_NAME}Card.json`);
  const cardContent = {
    name: ORCHESTRATOR_NAME,
    version: "1.0.0",
    id: ORCHESTRATOR_UUID,
    description: ORCHESTRATOR_DESCRIPTION,
    capabilities: ORCHESTRATOR_CAPABILITIES,
    apis: {
      message_endpoint: path.join(process.cwd(), 'lbrxAgents', '.a2a', 'messages'),
      discovery_endpoint: path.join(process.cwd(), 'lbrxAgents', '.a2a', 'discovery')
    },
    author: ORCHESTRATOR_NAME,
    created_at: new Date().toISOString()
  };
  
  fs.writeFileSync(cardPath, JSON.stringify(cardContent, null, 2));
  return cardPath;
}

// Utworzenie pliku orkiestratora
function createOrchestratorFile() {
  const orchestratorFile = path.join(agentApi.ORCHESTRATOR_PATH, 'orchestrator.json');
  fs.writeFileSync(orchestratorFile, JSON.stringify({
    id: ORCHESTRATOR_UUID,
    name: ORCHESTRATOR_NAME,
    project: PROJECT.name,
    status: 'active',
    created_at: new Date().toISOString()
  }, null, 2));
}

// Inicjalizacja globalnych instrukcji
function initializeGlobalInstructions() {
  const globalInstructionsPath = path.join(agentApi.ORCHESTRATOR_PATH, 'global_instructions.json');
  const globalInstructions = {
    title: `Instrukcje dla zespołu agentów projektu ${PROJECT.name}`,
    project: PROJECT,
    team_guidelines: [
      "Współpracujcie ze sobą przy realizacji zadań",
      "Informujcie o swoich postępach i problemach",
      "Przestrzegajcie ustalonego protokołu komunikacyjnego",
      "Respektujcie decyzje orkiestratora"
    ],
    communication_protocol: {
      message_types: [
        "query - zapytania i prośby o informacje",
        "response - odpowiedzi na zapytania",
        "notification - powiadomienia niewymagające odpowiedzi",
        "announcement - ogłoszenia o dołączeniu/opuszczeniu",
        "status_update - aktualizacje statusu prac",
        "task_request - prośby o przydzielenie zadań",
        "task_completion - informacje o zakończeniu zadań",
        "control - wiadomości kontrolne systemu"
      ],
      best_practices: [
        "Zawsze podawaj kontekst w wiadomościach",
        "Używaj odpowiednich typów wiadomości",
        "Potwierdzaj otrzymanie ważnych wiadomości",
        "Informuj o długotrwałych operacjach"
      ]
    }
  };
  
  fs.writeFileSync(globalInstructionsPath, JSON.stringify(globalInstructions, null, 2));
}

// Główna pętla
async function mainLoop() {
  // Przygotowanie katalogów
  agentApi.ensureDirsExist();
  
  // Tworzenie karty orkiestratora
  createOrchestratorCard();
  
  // Włączenie obsługi zakończenia procesu
  agentApi.enableShutdownHandlers();
  
  // Publikacja możliwości
  agentApi.publishCapabilities();
  console.log(`Orkiestrator ${ORCHESTRATOR_NAME} (${ORCHESTRATOR_UUID}) uruchomiony`);
  
  // Utworzenie pliku orkiestratora do wykrywania
  createOrchestratorFile();
  
  // Inicjalizacja globalnych instrukcji
  initializeGlobalInstructions();
  
  // Aktualizacja statusu projektu
  updateProjectStatus();
  
  // Zarejestruj handler wyłączenia
  agentApi.onShutdown(() => {
    console.log(`Orkiestrator ${ORCHESTRATOR_NAME} kończy działanie`);
    // Oznacz orkiestratora jako nieaktywnego
    const orchestratorStatusFile = path.join(agentApi.ORCHESTRATOR_PATH, 'status.json');
    fs.writeFileSync(orchestratorStatusFile, JSON.stringify({
      status: 'inactive',
      project: PROJECT.name,
      agents_count: Object.keys(teamAgents).length,
      last_update: new Date().toISOString(),
      message: `Orkiestrator ${ORCHESTRATOR_NAME} zakończył pracę`
    }, null, 2));
    return Promise.resolve();
  });
  
  // Odkryj istniejących agentów
  const discoveredAgents = agentApi.discoverAgents();
  discoveredAgents.forEach(agent => {
    if (agent.id !== ORCHESTRATOR_UUID) {
      console.log(`Wykryto agenta: ${agent.name} (${agent.id})`);
      teamAgents[agent.id] = {
        id: agent.id,
        name: agent.name,
        capabilities: agent.capabilities || [],
        description: agent.description || '',
        added_at: new Date().toISOString()
      };
      
      updateAgentStatus(agent.id, agent.active ? 'active' : 'unknown', agent.name);
    }
  });
  
  console.log(`Wykryto ${Object.keys(teamAgents).length} agentów w systemie`);
  
  // Okresowe pingowanie statusu (co minutę)
  const pingInterval = setInterval(() => {
    if (!agentApi.isShutdownRequested()) {
      agentApi.pingAgent(ORCHESTRATOR_UUID);
      updateProjectStatus();
    } else {
      clearInterval(pingInterval);
    }
  }, 60000);
  
  // Sprawdzanie aktywności agentów co 5 minut
  const activityCheckInterval = setInterval(() => {
    if (!agentApi.isShutdownRequested()) {
      checkAgentsActivity();
    } else {
      clearInterval(activityCheckInterval);
    }
  }, 300000);
  
  // Pętla sprawdzania wiadomości
  while (!agentApi.isShutdownRequested()) {
    try {
      // Pobierz nowe wiadomości
      const messages = agentApi.receiveMessages();
      
      // Obsługa wiadomości
      for (const message of messages) {
        try {
          const response = await handleMessage(message);
          
          // Jeśli mamy odpowiedź, wyślij ją
          if (response) {
            agentApi.respondToMessage(message, response);
            console.log(`Wysłano odpowiedź do ${message.sender_name}`);
          }
        } catch (err) {
          console.error(`Błąd podczas obsługi wiadomości: ${err.message}`);
        }
      }
      
      // Czekaj przed kolejnym sprawdzeniem
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`Błąd w głównej pętli: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
  
  // Posprzątaj przy wyjściu
  clearInterval(pingInterval);
  clearInterval(activityCheckInterval);
  console.log("Pętla orkiestratora zakończona");
}

/**
 * Sprawdzenie aktywności agentów
 */
function checkAgentsActivity() {
  const now = new Date();
  const inactivityThreshold = 15 * 60 * 1000; // 15 minut
  
  Object.keys(agentStatus).forEach(agentId => {
    if (agentStatus[agentId].status === 'active') {
      const lastUpdate = new Date(agentStatus[agentId].last_update);
      const timeSinceUpdate = now - lastUpdate;
      
      // Jeśli agent nie był aktywny przez 15 minut
      if (timeSinceUpdate > inactivityThreshold) {
        console.log(`Agent ${agentStatus[agentId].name} (${agentId}) nieaktywny od ${Math.floor(timeSinceUpdate / 60000)} minut`);
        
        // Oznacz jako nieaktywny
        updateAgentStatus(agentId, 'inactive', agentStatus[agentId].name);
        
        // Przepisz zadania
        reassignTasks(agentId);
      }
    }
  });
}

// Uruchom orkiestratora
mainLoop().catch(err => {
  console.error("Krytyczny błąd:", err);
  process.exit(1);
});