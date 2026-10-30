# -*- coding: utf-8 -*-
"""フック共通の小物"""
import datetime
import json
import os
import sys

HOOKS = os.path.dirname(os.path.abspath(__file__))
PROJECT = os.path.dirname(os.path.dirname(HOOKS))      # リポジトリのルート
STATE = os.path.join(PROJECT, ".claude", "state")      # git管理外の作業状態
DEPT_PREFIX = "chrome-"                               # この部のエージェント名の接頭辞
DEPT_NAME = "Chrome拡張機能部"

try:
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
except Exception:
    pass


def read_input():
    raw = sys.stdin.buffer.read().decode("utf-8", "replace")
    try:
        return json.loads(raw) if raw.strip() else {}
    except json.JSONDecodeError:
        return {}


def now():
    return datetime.datetime.now().astimezone()


def append_jsonl(name, rec):
    os.makedirs(STATE, exist_ok=True)
    with open(os.path.join(STATE, name), "a", encoding="utf-8") as f:
        f.write(json.dumps(rec, ensure_ascii=False) + "\n")


def tail_jsonl(name, n):
    path = os.path.join(STATE, name)
    if not os.path.exists(path):
        return []
    with open(path, encoding="utf-8") as f:
        lines = f.readlines()[-n:]
    out = []
    for line in lines:
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            pass
    return out
