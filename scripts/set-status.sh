#!/bin/bash
# Update Rex's status in JsonBlob (used by Rex HQ game)
# Usage: set-status.sh <idle|typing|working>
BLOB_ID="019c7ca8-2374-76ce-997a-bca381102a49"
STATUS="${1:-idle}"
curl -s -X PUT "https://jsonblob.com/api/jsonBlob/$BLOB_ID" \
  -H "Content-Type: application/json" \
  -d "{\"status\":\"$STATUS\"}" > /dev/null
