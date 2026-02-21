#!/bin/bash
# Post a Rex reply to the chat KV so it shows in the app
# Usage: chat-reply.sh "message text"
API="https://rex-status.rex-hq.workers.dev"
if [ -z "$1" ]; then echo "Usage: chat-reply.sh <message>"; exit 1; fi
BODY=$(python3 -c "import json,sys; print(json.dumps({'text': sys.argv[1]}))" "$1")
curl -s -X POST "$API/chat/reply" -H "Content-Type: application/json" -d "$BODY"
