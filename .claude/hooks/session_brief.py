# -*- coding: utf-8 -*-
"""SessionStart：部長が起動したとき、判断待ち・社長指示・直近の活動・共通仕様のずれを知らせる。

標準出力がそのまま会話の最初に入る。GitHub の情報は gh コマンドで取る（未設定なら省略）。
"""
import json
import os
import shutil
import subprocess
import sys

from hooklib import DEPT_NAME, PROJECT, now, read_input, tail_jsonl

OWNER = "potstudio0206"


def gh_json(args):
    if not shutil.which("gh"):
        return None, "gh コマンドが無いため取得できません（docs/90_handbook/pc-setup.md 参照）"
    try:
        r = subprocess.run(["gh"] + args, cwd=PROJECT, capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=12)
    except Exception as e:
        return None, f"取得できませんでした（{e.__class__.__name__}）"
    if r.returncode != 0:
        return None, "取得できませんでした（gh auth login が必要かもしれません）"
    try:
        return json.loads(r.stdout or "[]"), None
    except json.JSONDecodeError:
        return None, "取得できませんでした（応答を読めません）"


def fmt_time(iso):
    return (iso or "")[5:16].replace("T", " ")


def issues(label):
    data, err = gh_json(["issue", "list", "--label", label, "--state", "open", "--limit", "20",
                         "--json", "number,title,updatedAt,comments"])
    if err:
        return [f"  {err}"]
    if not data:
        return ["  なし"]
    lines = []
    for it in data:
        comments = it.get("comments") or []
        last = comments[-1] if comments else None
        mark = ""
        if last and (last.get("author") or {}).get("login") == OWNER:
            mark = "　★社長のコメントあり"
        lines.append(f"  #{it['number']} {it['title']}（更新 {fmt_time(it.get('updatedAt'))}）{mark}")
    return lines


def activity():
    recs = [r for r in tail_jsonl("activity.jsonl", 40) if r.get("event") == "stop"][-10:]
    if not recs:
        return ["  記録なし"]
    out = []
    for r in recs:
        s = f"  {fmt_time(r.get('time'))} {r.get('agent')} {r.get('status', '')}"
        if r.get("summary"):
            s += f"：{r['summary'][:80]}"
        out.append(s)
    return out


def shared_sync():
    script = os.path.join(PROJECT, "scripts", "check_shared_sync.py")
    try:
        r = subprocess.run([sys.executable, script], capture_output=True, text=True,
                           encoding="utf-8", errors="replace", timeout=15)
        return (r.stdout or r.stderr).strip().splitlines()[:6] or ["  確認できませんでした"]
    except Exception:
        return ["  確認できませんでした"]


def main():
    read_input()
    lines = [f"【起動時ブリーフィング】{now().strftime('%Y-%m-%d %H:%M')}（{DEPT_NAME}）",
             "■ 社長の判断待ち（ラベル「社長判断」）"] + issues("社長判断")
    lines += ["■ 社長指示（未完了・ラベル「社長指示」）"] + issues("社長指示")
    lines += ["■ 直近の活動（課長・係長の作業終了、最新10件）"] + activity()
    lines += ["■ 共通仕様（shared/）"] + ["  " + x.strip() for x in shared_sync()]
    lines += ["※ ★の付いた判断待ちは、社長の返答を読んで作業を再開してください。"]
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
