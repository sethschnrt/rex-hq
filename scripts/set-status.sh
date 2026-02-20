#!/bin/bash
# Update Rex's status on Cloudflare Worker (used by Rex HQ game)
# Usage: set-status.sh <idle|typing|working>
STATUS="${1:-idle}"
curl -s -X PUT "https://rex-status.rex-hq.workers.dev" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"$STATUS\"}" > /dev/null 2>&1
