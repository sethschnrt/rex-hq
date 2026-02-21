#!/bin/bash
# Task management CLI
# Usage:
#   tasks.sh list [board]          — list tasks (optional: seth|rex)
#   tasks.sh add <title> [board]   — add task (default: rex board, todo column)
#   tasks.sh done <id>             — move task to done
#   tasks.sh progress <id>         — move task to in progress
#   tasks.sh delete <id>           — delete task

API="https://rex-status.rex-hq.workers.dev"

case "$1" in
  list)
    if [ -n "$2" ]; then
      curl -s "$API/tasks?board=$2" | python3 -m json.tool
    else
      curl -s "$API/tasks" | python3 -m json.tool
    fi
    ;;
  add)
    BOARD="${3:-rex}"
    curl -s -X POST "$API/tasks" \
      -H "Content-Type: application/json" \
      -d "{\"title\":\"$2\",\"board\":\"$BOARD\",\"column\":\"todo\"}" | python3 -m json.tool
    ;;
  done)
    curl -s -X PUT "$API/tasks/$2" \
      -H "Content-Type: application/json" \
      -d '{"column":"done"}' | python3 -m json.tool
    ;;
  progress)
    curl -s -X PUT "$API/tasks/$2" \
      -H "Content-Type: application/json" \
      -d '{"column":"progress"}' | python3 -m json.tool
    ;;
  delete)
    curl -s -X DELETE "$API/tasks/$2" | python3 -m json.tool
    ;;
  *)
    echo "Usage: tasks.sh <list|add|done|progress|delete> [args]"
    ;;
esac
