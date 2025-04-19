#!/bin/bash

# Skrypt do szybkiego wysyłania wiadomości

if [ $# -lt 2 ]; then
  echo "Użycie: $0 <id-odbiorcy> <treść-wiadomości> [typ-wiadomości]"
  echo "Typy wiadomości: query (domyślnie), response, notification, action"
  exit 1
fi

RECIPIENT_ID=$1
MESSAGE_TEXT=$2
MESSAGE_TYPE=${3:-"query"}

# Wysyłanie wiadomości przez API
node -e "const api = require('../src/agent-api.js'); const result = api.sendMessage('$RECIPIENT_ID', { text: '$MESSAGE_TEXT' }, '$MESSAGE_TYPE'); console.log(result ? 'Wiadomość wysłana pomyślnie' : 'Błąd wysyłania wiadomości');"
