#!/usr/bin/env bash
# Python のフックを、その環境にある Python で実行する（Windows の Git Bash / Mac / Linux 共通）
# 使い方: bash run.sh <フック名.py>
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT="$DIR/$1"
shift
for PY in python python3; do
  if command -v "$PY" >/dev/null 2>&1 && "$PY" -c "import sys" >/dev/null 2>&1; then
    exec "$PY" "$SCRIPT" "$@"
  fi
done
if command -v py >/dev/null 2>&1; then
  exec py -3 "$SCRIPT" "$@"
fi
echo "Python が見つからないため、フック $(basename "$SCRIPT") をスキップしました" >&2
exit 0
