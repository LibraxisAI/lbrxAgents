# Rozwiązywanie problemów z komunikacją A2A

Ten dokument zawiera wskazówki dotyczące rozwiązywania typowych problemów z protokołem komunikacji Agent-to-Agent (A2A).

## Problemy z konfiguracją ścieżek

### Problem: Agenci nie widzą nawzajem swoich wiadomości

**Przyczyna**: Różne ścieżki bazowe dla wiadomości.

**Rozwiązanie**:
1. Upewnij się, że wszyscy agenci używają tej samej ścieżki bazowej:
   ```javascript
   const api = require('./agent-api.js');
   api.setBasePath('/tmp/a2a-protocol');
   ```
2. Sprawdź, czy katalogi istnieją i mają odpowiednie uprawnienia:
   ```bash
   mkdir -p /tmp/a2a-protocol/messages /tmp/a2a-protocol/discovery
   chmod 777 /tmp/a2a-protocol/messages /tmp/a2a-protocol/discovery
   ```

### Problem: Skrypty pomocnicze nie działają

**Przyczyna**: Niepoprawne ścieżki do plików w skryptach.

**Rozwiązanie**:
1. Upewnij się, że jesteś w katalogu głównym pakietu:
   ```bash
   cd lbrxAgents  # Lub inna lokalizacja, gdzie jest pakiet
   ```
2. Sprawdź, czy skrypty mają uprawnienia do wykonania:
   ```bash
   chmod +x *.sh
   ```
3. Sprawdź ścieżki w skryptach:
   ```bash
   sed -i 's|agents/communication/agent-api.js|./agent-api.js|g' *.sh
   ```

## Problemy z wiadomościami

### Problem: Nieskończona pętla wiadomości

**Przyczyna**: Wiadomości nie są usuwane po odczytaniu.

**Rozwiązanie**:
1. Użyj parametru `markAsRead=true` w `receiveMessages()`:
   ```javascript
   const messages = api.receiveMessages(true);  // Oznacz jako przeczytane
   ```
2. Sprawdź, czy katalog `/tmp/a2a-protocol/messages/read` istnieje:
   ```bash
   mkdir -p /tmp/a2a-protocol/messages/read
   ```

### Problem: Duplikaty wiadomości

**Przyczyna**: Wiadomości są kopiowane do wielu katalogów.

**Rozwiązanie**:
1. Wyczyść katalogi wiadomości:
   ```bash
   rm -rf /tmp/a2a-protocol/messages/*
   ```
2. Używaj wersji protokołu, która usuwa wiadomości po odczytaniu.

## Problemy z identyfikacją agentów

### Problem: Brak możliwości odkrycia agentów

**Przyczyna**: Agent nie opublikował swoich możliwości.

**Rozwiązanie**:
1. Upewnij się, że każdy agent publikuje swoje możliwości:
   ```javascript
   api.publishCapabilities();
   ```
2. Sprawdź, czy plik AgentCard.json istnieje i ma poprawną strukturę:
   ```bash
   cat AgentCard.json
   ```

### Problem: Konflikt UUID agentów

**Przyczyna**: Agenci używają tego samego UUID.

**Rozwiązanie**:
1. Wygeneruj nowe UUID dla każdego agenta:
   ```bash
   uuidgen
   ```
2. Zaktualizuj AgentCard.json z nowym UUID:
   ```javascript
   // Przykład tworzenia agenta z nowym UUID
   const agent = a2a.createAgent({
     name: 'UniqueAgent',
     id: 'TWÓJ-NOWY-UUID',  // Wygenerowany przez uuidgen
     capabilities: ['example']
   });
   ```

## Problemy z komunikacją między różnymi modelami LLM

### Problem: Niezgodność formatów wiadomości

**Przyczyna**: Różne modele używają różnych formatów danych.

**Rozwiązanie**:
1. Standaryzuj format wiadomości:
   ```javascript
   // Wysyłanie wiadomości w standardowym formacie
   api.sendMessage(targetId, {
     text: "Główna treść wiadomości",
     data: {  // Dodatkowe dane jako obiekt
       type: "example",
       format: "standard"
     }
   });
   ```
2. Rozważ dodanie adaptera formatów:
   ```javascript
   // Przykładowy adapter (do implementacji)
   function adaptMessageFormat(message, targetFormat) {
     // Konwersja formatu
     return convertedMessage;
   }
   ```

### Problem: Claude/GPT nie rozumie protokołu

**Przyczyna**: LLM nie ma kontekstu protokołu A2A.

**Rozwiązanie**:
1. Dodaj jasne instrukcje do prompta LLM:
   ```
   Jesteś agentem w systemie multi-agentowym używającym protokołu A2A.
   Komunikacja między agentami odbywa się poprzez wymianę wiadomości JSON.
   Aby odebrać wiadomości, użyj: api.receiveMessages()
   Aby odpowiedzieć, użyj: api.respondToMessage(message, {text: "Odpowiedź"})
   ```
2. Używaj przykładów w instrukcjach dla LLM.

## Rozwiązywanie problemów z CLI

### Problem: Polecenia CLI nie są rozpoznawane

**Przyczyna**: CLI nie jest zainstalowane lub nie jest w PATH.

**Rozwiązanie**:
1. Użyj ścieżki bezwzględnej do skryptu CLI:
   ```bash
   node /ścieżka/do/lbrxAgents/cli.js discover
   ```
2. Zainstaluj pakiet globalnie (po opublikowaniu):
   ```bash
   npm install -g lbrx-agents
   ```

### Problem: CLI pokazuje błędy składni

**Przyczyna**: Parametry z znakami specjalnymi.

**Rozwiązanie**:
1. Używaj cudzysłowów dla argumentów z spacjami lub znakami specjalnymi:
   ```bash
   node cli.js send "TARGET_ID" "Wiadomość ze spacjami i znakami: !@#"
   ```

## Integracja z aplikacjami

### Problem: Integracja z serwerem Express

**Przyczyna**: Brak przekazania kontekstu między żądaniami.

**Rozwiązanie**:
1. Używaj singleton pattern dla instancji agenta:
   ```javascript
   // agent-singleton.js
   const a2a = require('a2a-protocol');
   let agentInstance = null;
   
   function getAgent() {
     if (!agentInstance) {
       agentInstance = a2a.createAgent({
         name: 'ServerAgent',
         capabilities: ['api', 'web']
       });
     }
     return agentInstance;
   }
   
   module.exports = { getAgent };
   ```
2. Użyj w obsłudze żądań:
   ```javascript
   const { getAgent } = require('./agent-singleton');
   
   app.get('/messages', (req, res) => {
     const agent = getAgent();
     const messages = agent.receiveMessages();
     res.json(messages);
   });
   ```

## Poprawianie wydajności

### Problem: Wolna komunikacja przy dużej liczbie wiadomości

**Przyczyna**: Skanowanie wszystkich plików.

**Rozwiązanie**:
1. Zaimplementuj indeksowanie wiadomości:
   ```javascript
   // Przykładowa implementacja indeksu (do rozwoju)
   function buildMessageIndex() {
     // Buduj indeks wiadomości
   }
   ```
2. Rozważ użycie bazy danych zamiast systemu plików:
   ```javascript
   // W przyszłych wersjach protokołu
   a2a.configure({
     storage: 'database',
     connectionString: 'mongodb://localhost:27017/a2a'
   });
   ```

## Podsumowanie

Jeśli powyższe rozwiązania nie pomogły, wykonaj pełną diagnostykę:

1. Sprawdź logi:
   ```bash
   cat /tmp/a2a-protocol/logs/*.log  # Jeśli włączono logowanie
   ```
2. Wykonaj pełny reset protokołu:
   ```bash
   rm -rf /tmp/a2a-protocol/* && mkdir -p /tmp/a2a-protocol/{messages,discovery,read}
   ```
3. Zrestartuj wszystkich agentów z tymi samymi parametrami.