#!/bin/bash

# Skrypt do listowania aktywnych agentów

echo "Aktywni agenci w systemie:"
echo "============================"

find /tmp/a2a-protocol/discovery -name "*.json" -type f | sort | while read -r file; do
  agent_name=$(grep -m 1 "name" "$file" | cut -d '"' -f 4)
  agent_id=$(grep -m 1 "id" "$file" | cut -d '"' -f 4)
  agent_desc=$(grep -m 1 "description" "$file" | cut -d '"' -f 4)
  capabilities=$(grep -A 10 "capabilities" "$file" | grep -v "capabilities" | grep -m 1 "\]" -B 10 | grep -v "\]" | tr -d '",' | sed 's/^ *//')
  
  echo "[$agent_name] - $agent_id"
  echo "Opis: $agent_desc"
  echo "Możliwości:"
  echo "$capabilities" | while read -r cap; do
    [ -n "$cap" ] && echo "- $cap"
  done
  echo ""
done

echo "Aby wysłać wiadomość, użyj CLI:"
echo "node src/agent-cli.js"
echo "lub API w kodzie:"
echo "const agentApi = require('./src/agent-api');"
echo "agentApi.sendMessage('<id-odbiorcy>', { text: 'Treść wiadomości' });"
