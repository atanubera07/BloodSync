#!/usr/bin/env bash
set -euo pipefail
api_pid=''
stop_api() {
  if [[ -n "$api_pid" ]]; then
    kill "$api_pid" 2>/dev/null || true
    wait "$api_pid" 2>/dev/null || true
    api_pid=''
  fi
}
trap stop_api EXIT
start_api() {
  node apps/api/dist/apps/api/src/main.js > "${RUNNER_TEMP:-/tmp}/bloodsync-api-test.log" 2>&1 &
  api_pid=$!
  for _ in {1..30}; do
    if curl --noproxy '*' --silent --fail http://localhost:4000/health >/dev/null; then return; fi
    sleep 1
  done
  cat "${RUNNER_TEMP:-/tmp}/bloodsync-api-test.log"
  return 1
}
start_api
python3 scripts/smoke-auth.py
stop_api
start_api
python3 scripts/smoke-phase2.py
