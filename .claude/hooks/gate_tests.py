# -*- coding: utf-8 -*-
"""SubagentStop（開発課の係・リファクタリングの移行係）：速いテストが通るまで「完了」にさせない関所。

テストが落ちていたら終了を止め、失敗内容を係長に返して直させる。
同じ係長が2回止められたら、3回目は記録だけして通す（無限に止めないため）。課長のレビューで扱う。
"""
import os
import re
import subprocess
import sys

from hooklib import STATE, append_jsonl, now, read_input

TEST_CMD = ["node", "--test", "tests/unit/*.test.js"]
MAX_BLOCKS = 2


def main():
    data = read_input()
    agent = data.get("agent_type") or "?"
    agent_id = data.get("agent_id") or agent
    cwd = data.get("cwd") or os.getcwd()
    if not os.path.isdir(os.path.join(cwd, "tests")):
        cwd = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    cmd = [sys.executable if c == "PYTHON" else c for c in TEST_CMD]
    try:
        r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, encoding="utf-8",
                           errors="replace", timeout=540)
    except FileNotFoundError:
        print(f"テストを実行できませんでした（{cmd[0]} が見つかりません）", file=sys.stderr)
        return 0
    except subprocess.TimeoutExpired:
        print("テストが時間内に終わりませんでした", file=sys.stderr)
        return 0
    if r.returncode == 0:
        return 0
    os.makedirs(os.path.join(STATE, "gate"), exist_ok=True)
    counter = os.path.join(STATE, "gate", f"{agent_id}.count")
    n = int(open(counter).read()) if os.path.exists(counter) else 0
    out = (r.stdout + "\n" + r.stderr).strip().splitlines()
    if n >= MAX_BLOCKS:
        fails = [x.strip() for x in out if re.search(r"not ok|FAIL|ERROR|Error", x)][:3] or out[-3:]
        append_jsonl("activity.jsonl", {"time": now().isoformat(timespec="seconds"), "agent": agent,
                                        "agent_id": agent_id, "event": "gate",
                                        "status": "テスト未通過のまま終了", "summary": " / ".join(fails)[:300]})
        return 0
    with open(counter, "w") as f:
        f.write(str(n + 1))
    print("【関所】速いテストが落ちています。直してから終了してください（"
          f"{n + 1}/{MAX_BLOCKS}回目）。\n実行: {' '.join(cmd)}\n" + "\n".join(out[-40:]), file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
