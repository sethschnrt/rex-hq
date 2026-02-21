#!/bin/bash
# Check for unread user messages from Rex HQ app
API="https://rex-status.rex-hq.workers.dev"
curl -s "$API/chat/pending" | python3 -m json.tool
