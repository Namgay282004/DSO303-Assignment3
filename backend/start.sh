#!/bin/sh
set -eu

node src/services/markingWorker.js &
WORKER_PID=$!

node src/server.js &
API_PID=$!

cleanup() {
  kill "$API_PID" "$WORKER_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}

trap cleanup TERM INT

wait "$API_PID"
cleanup
