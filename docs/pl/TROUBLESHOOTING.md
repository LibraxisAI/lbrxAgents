# Rozwiązywanie problemów z protokołem lbrxAgents

Ten dokument zawiera rozwiązania najczęstszych problemów, które mogą wystąpić podczas pracy z protokołem lbrxAgents.

## Problemy z konfiguracją

### Problem: Katalogi komunikacyjne nie są tworzone

**Objawy:**
- Błędy ENOENT (No such file or directory)
- Wiadomości nie są dostarczane
- Agenci nie są wykrywani

**Rozwiązanie:**
1. Upewnij się, że masz odpowiednie uprawnienia do tworzenia katalogów
2. Sprawdź ścieżkę BASE_PATH w kodzie
3. Ręcznie utwórz strukturę katalogów:
```bash
mkdir -p /ścieżka/do/projektu/lbrxAgents/.a2a/{messages,discovery,status,orchestrator}
```

### Problem: Identyfikator UUID agenta nie jest unikalny

**Objawy:**
- Wiadomości są dostarczane do niewłaściwego agenta
- Konflikty między agentami

**Rozwiązanie:**
1. Użyj polecenia `uuidgen` w terminalu, aby wygenerować unikalny UUID
2. Upewnij się, że każdy agent ma inny UUID
3. Sprawdź, czy nie używasz tego samego pliku agenta dla wielu instancji

## Problemy z komunikacją

### Problem: Wiadomości nie są dostarczane

**Objawy:**
- Agent nie otrzymuje wiadomości
- Brak odpowiedzi na wysłane wiadomości

**Rozwiązanie:**
1. Sprawdź, czy agent docelowy jest aktywny:
```javascript
const isActive = agentApi.isAgentActive(targetAgentId);
console.log(`Agent ${targetAgentId} aktywny: ${isActive}`);
```

2. Upewnij się, że używasz poprawnego UUID agenta docelowego
3. Sprawdź logi błędów podczas wysyłania wiadomości
4. Zweryfikuj strukturę wiadomości

### Problem: Wiadomości są odbierane wielokrotnie

**Objawy:**
- Ten sam komunikat jest przetwarzany wiele razy
- Duplikaty odpowiedzi

**Rozwiązanie:**
1. Upewnij się, że ustawiłeś parametr `markAsRead` na `true` w wywołaniu `receiveMessages()`
2. Implementuj śledzenie już przetworzonych wiadomości:
```javascript
const processedMessageIds = new Set();

function handleMessages() {
  const messages = agentApi.receiveMessages(true);
  
  for (const message of messages) {
    if (!processedMessageIds.has(message.message_id)) {
      processedMessageIds.add(message.message_id);
      // Przetwarzanie wiadomości...
    }
  }
}
```

## Problemy z agentami

### Problem: Agent nie reaguje na polecenia zatrzymania

**Objawy:**
- Agent nie kończy działania po naciśnięciu Ctrl+C
- Proces agenta musi być zabity przez `kill -9`

**Rozwiązanie:**
1. Upewnij się, że włączyłeś obsługę zakończenia procesu:
```javascript
agentApi.enableShutdownHandlers();
```

2. Sprawdź, czy używasz warunków wyjścia z pętli:
```javascript
while (!agentApi.isShutdownRequested()) {
  // Pętla agenta
}
```

3. Zarejestruj handler wyłączenia:
```javascript
agentApi.onShutdown(() => {
  console.log("Sprzątanie przed zamknięciem...");
  return Promise.resolve();
});
```

### Problem: Agent zawiesza się lub zużywa dużo zasobów

**Objawy:**
- Wysoki poziom użycia CPU
- Powolne działanie
- Brak odpowiedzi

**Rozwiązanie:**
1. Sprawdź interwały czasowe w pętli głównej
2. Dodaj obsługę błędów w głównej pętli
3. Zaimplementuj timeout dla długotrwałych operacji
4. Monitoruj używanie pamięci

## Problemy z orkiestratorem

### Problem: Orkiestrator nie wykrywa wszystkich agentów

**Objawy:**
- Brakujące agenty w liście odkrytych agentów
- Brak koordynacji między niektórymi agentami

**Rozwiązanie:**
1. Upewnij się, że wszyscy agenci publikują swoje możliwości:
```javascript
agentApi.publishCapabilities();
```

2. Sprawdź, czy używają tego samego BASE_PATH
3. Zweryfikuj uprawnienia do plików i katalogów
4. Ręcznie sprawdź pliki w katalogu discovery

### Problem: Orkiestrator nie przydziela zadań

**Objawy:**
- Agenci nie otrzymują zadań
- Zadania nie są wykonywane

**Rozwiązanie:**
1. Upewnij się, że zdefiniowano zadania w orkiestratorze
2. Sprawdź logikę przydzielania zadań
3. Zweryfikuj, czy agenci mają odpowiednie możliwości
4. Dodaj więcej logów do diagnostyki

## Problemy z bezpieczeństwem

### Problem: Wycieki pamięci lub zasoby nie są zwalniane

**Objawy:**
- Rosnące użycie pamięci
- Pozostawione pliki tymczasowe

**Rozwiązanie:**
1. Rejestruj funkcje sprzątające przy zamknięciu:
```javascript
agentApi.onShutdown(() => {
  // Zwolnij zasoby, zamknij połączenia, itp.
  console.log("Sprzątanie zasobów...");
  return Promise.resolve();
});
```

2. Implementuj ręczne usuwanie plików tymczasowych
3. Monitoruj zużycie zasobów

### Problem: Wyciek poufnych informacji

**Objawy:**
- Wrażliwe dane są widoczne w logach lub wiadomościach

**Rozwiązanie:**
1. Filtruj poufne dane przed logowaniem
2. Nie umieszczaj poufnych danych w wiadomościach
3. Implementuj sanityzację danych

## Znane ograniczenia

- **Brak szyfrowania wiadomości** - wiadomości są przechowywane jako pliki JSON w formacie plaintext
- **Brak mechanizmu autoryzacji** - każdy agent może odczytać wiadomości innych agentów
- **Ograniczenia skalowalności** - protokół używa systemu plików, co może powodować problemy przy dużej liczbie wiadomości lub agentów

## Pomoc techniczna

Jeśli nie możesz rozwiązać problemu korzystając z tego poradnika:

1. Sprawdź pełną [dokumentację protokołu](./PROTOCOL.md)
2. Przestudiuj [przykłady](../examples)
3. Zgłoś problem w [repozytorium GitHub](https://github.com/LibraxisAI/lbrxAgents/issues)