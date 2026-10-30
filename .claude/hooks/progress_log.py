# -*- coding: utf-8 -*-
"""SubagentStart / SubagentStop：課長・係長の作業の開始と終了を .claude/state/activity.jsonl に記録する。

会議の代わりに、誰が何をしてどうなったかを自動で残す（トークンは使わない）。
終了時は報告の書式（状態: / 成果物: / 要約: / 次の担当: / 論点:）を読み取る。
"""
import re
import sys

from hooklib import DEPT_PREFIX, append_jsonl, now, read_input

FIELDS = {"状態": "status", "成果物": "output", "要約": "summary", "次の担当": "next", "論点": "issue"}


def parse_report(text):
    out = {}
    for line in (text or "").splitlines():
        m = re.match(r"^\s*[-*]?\s*\**(状態|成果物|要約|次の担当|論点)\**\s*[:：]\s*(.*)$", line)
        if m and FIELDS[m.group(1)] not in out:
            out[FIELDS[m.group(1)]] = m.group(2).strip()[:300]
    return out


def main():
    data = read_input()
    agent = data.get("agent_type") or ""
    if not agent.startswith(DEPT_PREFIX):
        return 0
    event = data.get("hook_event_name", "")
    rec = {"time": now().isoformat(timespec="seconds"), "agent": agent, "agent_id": data.get("agent_id")}
    if event == "SubagentStart":
        rec["event"] = "start"
    else:
        rec["event"] = "stop"
        msg = data.get("last_assistant_message") or ""
        rec.update(parse_report(msg))
        if "status" not in rec:
            rec["status"] = "（書式なし）"
            rec["summary"] = msg.strip().replace("\n", " ")[:200]
    append_jsonl("activity.jsonl", rec)
    return 0


if __name__ == "__main__":
    sys.exit(main())
