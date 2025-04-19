# Monitorowanie Sesji Agentów w lbrxAgents

Framework lbrxAgents zawiera teraz zaawansowane funkcje monitorowania sesji, które pozwalają śledzić i obserwować aktywność agentów w wielu terminalach i sesjach.

## Dwupoziomowa Identyfikacja Agentów

Każdy agent w systemie ma dwuczęściowy identyfikator:

1. **AGENT_ID** (rola) - Funkcjonalny identyfikator agenta (np. "uiuxdev", "backenddev")
2. **SESSION_ID** (sesja) - Unikalny UUID generowany dla każdej sesji terminala
3. **Połączony ID** - `AGENT_ID__SESSION_ID`

Ta architektura umożliwia:
- Równoczesne działanie wielu instancji tego samego typu agenta
- Każda sesja bierze odpowiedzialność za swoją pracę
- Płynne przekazywanie zadań między sesjami
- Pełne monitorowanie sesji

## Monitorowanie Sesji

CLI zawiera nową komendę do monitorowania sesji agentów:

```bash
# Lista wszystkich sesji dla określonego typu agenta
a2a monitor uiuxdev

# Monitorowanie konkretnej sesji
a2a monitor uiuxdev <session-id>
```

### Funkcje

- **Wykrywanie Sesji** - Znajdowanie wszystkich sesji dla określonej roli agenta
- **Status Sesji** - Sprawdzanie, które sesje są aktywne lub zakończone
- **Dostęp do Logów** - Przeglądanie logów z sesji zarówno aktywnych, jak i zakończonych
- **Monitorowanie na Żywo** - Obserwowanie wyjścia terminala aktywnych sesji w czasie rzeczywistym
- **Historia** - Przeglądanie logów z sesji, które już się zakończyły

## Jak to Działa

Każda sesja agenta automatycznie zapisuje całe wyjście konsoli do dedykowanego pliku logów w katalogu danych frameworka. Pliki logów są tworzone według konwencji nazewnictwa `AGENT_ID__SESSION_ID.log`.

Podczas monitorowania sesji:
1. Dla aktywnych sesji otrzymujesz strumień wyjścia terminala agenta na żywo
2. Dla zakończonych sesji możesz przeglądać logi z czasu, gdy agent był uruchomiony

## Przypadki Użycia

### Współpraca Developerska

Wielu deweloperów pracujących nad tym samym aspektem projektu może:
- Uruchamiać własne instancje tego samego typu agenta (np. "uiuxdev")
- Monitorować postęp innych w czasie rzeczywistym
- Kontynuować pracę od miejsca, w którym inni zakończyli

### Debugowanie i Rozwiązywanie Problemów

Gdy agent napotyka problemy:
- Sprawdź logi nawet po zakończeniu sesji
- Zidentyfikuj, kiedy i gdzie wystąpiły problemy
- Porównaj logi między różnymi sesjami

### Koordynacja

Kierownicy zespołu lub orkiestratorzy mogą:
- Monitorować postęp wielu sesji agentów
- Identyfikować, które agenty są aktywne
- Przeglądać ukończoną pracę z poprzednich sesji

## Struktura Katalogów Logów

Wszystkie logi są przechowywane w katalogu danych frameworka, w podkatalogu `logs`:

```
lbrxAgents/.a2a/logs/
├── uiuxdev__6D394CD3-AFD6-4EF8-8AE8-9EFA4E08EF93.log
├── uiuxdev__8F23A719-C05F-4B2A-AE51-27BC14E9AF12.log
├── backenddev__A7C2E935-88F7-4DB1-9081-56BAD0945D8F.log
└── ...
```

Sesje są logowane automatycznie, z wpisami dla każdego wywołania console.log, console.error i console.warn, a także znacznikami początku i końca sesji.