#!/bin/bash

# Skrypt do tworzenia nowego agenta

if [ $# -lt 2 ]; then
  echo "Użycie: $0 <nazwa-agenta> <opis> [zdolność1,zdolność2,...]"
  exit 1
fi

AGENT_NAME=$1
AGENT_DESCRIPTION=$2
CAPABILITIES=${3:-"coding,architecture,design"}

# Generuj UUID
AGENT_UUID=$(uuidgen)

# Utwórz katalog agenta jeśli nie istnieje
mkdir -p /tmp/quantum-scout/agents/messages
mkdir -p /tmp/quantum-scout/agents/discovery

# Utwórz kartę agenta
cat > "$(dirname "$0")/${AGENT_NAME}Card.json" <<EOL
{
  "name": "${AGENT_NAME}",
  "version": "1.0.0",
  "id": "${AGENT_UUID}",
  "description": "${AGENT_DESCRIPTION}",
  "capabilities": [
    $(echo $CAPABILITIES | sed 's/,/","/g' | sed 's/^/"/;s/$/"/')
  ],
  "apis": {
    "message_endpoint": "/tmp/quantum-scout/agents/messages/",
    "discovery_endpoint": "/tmp/quantum-scout/agents/discovery/"
  },
  "author": "${AGENT_NAME}",
  "created_at": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
}
EOL

# Skopiuj szablon agenta
sed "s/TWÓJ-UUID-TUTAJ/${AGENT_UUID}/g; s/NazwaAgenta/${AGENT_NAME}/g; s/Opis twojego agenta i jego roli/${AGENT_DESCRIPTION}/g" "$(dirname "$0")/agent-template.js" > "$(dirname "$0")/${AGENT_NAME}-agent.js"

# Opublikuj możliwości
node -e "const api = require('./agents/communication/agent-api.js'); api.publishCapabilities();"

echo "Agent ${AGENT_NAME} utworzony pomyślnie!"
echo "UUID: ${AGENT_UUID}"
echo "Możesz uruchomić agenta poleceniem:"
echo "node agents/communication/${AGENT_NAME}-agent.js"
