# -*- coding: utf-8 -*-
"""PreToolUse（Edit / Write / NotebookEdit）：エージェントごとの持ち場の外は書かせない。

持ち場は .claude/hooks/ownership.json に書く。
- エージェント指定のないセッション（人が直接操作）は制限しない
- リポジトリの外（一時ファイルなど）は制限しない
- 自分のメモリ .claude/agent-memory/<自分>/ は常に書ける
"""
import json
import os
import re
import sys

from hooklib import HOOKS, read_input


def find_root(path):
    d = os.path.dirname(os.path.abspath(path))
    while True:
        if os.path.exists(os.path.join(d, ".git")):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            return None
        d = parent


def to_regex(pattern):
    out, i = "", 0
    while i < len(pattern):
        if pattern.startswith("**", i):
            out += ".*"
            i += 2
        elif pattern[i] == "*":
            out += "[^/]*"
            i += 1
        else:
            out += re.escape(pattern[i])
            i += 1
    return re.compile("^" + out + "$", re.IGNORECASE if os.name == "nt" else 0)


def main():
    data = read_input()
    agent = data.get("agent_type")
    ti = data.get("tool_input") or {}
    path = ti.get("file_path") or ti.get("notebook_path")
    if not agent or not path:
        return 0
    root = find_root(path)
    if root is None:
        return 0
    rel = os.path.relpath(os.path.abspath(path), root).replace(os.sep, "/")
    if rel.startswith("../"):
        return 0
    with open(os.path.join(HOOKS, "ownership.json"), encoding="utf-8") as f:
        rules = json.load(f)
    patterns = list(rules["roles"].get(agent, rules["unknown_agent"]))
    patterns.append(f".claude/agent-memory/{agent}/**")
    if any(to_regex(p).match(rel) for p in patterns):
        return 0
    allowed = "、".join(p for p in patterns if not p.startswith(".claude/agent-memory/"))
    print(f"【持ち場の外】{agent} は {rel} を編集できません。"
          f"編集できるのは: {allowed}。担当の係に任せるか、課長・部長に報告してください。", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
