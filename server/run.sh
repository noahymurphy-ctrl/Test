#!/usr/bin/env bash
# Convenience launcher for the Fair Copy backend. See ../README.md for the
# one-time setup this depends on.
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -d "venv" ]; then
  echo "No server/venv found yet. Set it up first:"
  echo ""
  echo "  cd server"
  echo "  python3 -m venv venv"
  echo "  source venv/bin/activate"
  echo "  pip install -r requirements.txt"
  echo ""
  exit 1
fi

source venv/bin/activate
exec uvicorn main:app --reload --port 8000
