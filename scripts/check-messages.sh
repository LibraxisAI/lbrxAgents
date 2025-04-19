#!/bin/bash

# Skrypt do sprawdzania wiadomości

# Opcjonalny parametr: czy oznaczyć jako przeczytane
MARK_AS_READ=${1:-"false"}

# Sprawdzanie wiadomości przez API
node -e "const api = require('../src/agent-api.js'); const messages = api.receiveMessages($MARK_AS_READ); console.log('\nOtrzymane wiadomości: ' + messages.length); if (messages.length > 0) { console.log('\n' + JSON.stringify(messages, null, 2)); } else { console.log('Brak nowych wiadomości.'); }"
