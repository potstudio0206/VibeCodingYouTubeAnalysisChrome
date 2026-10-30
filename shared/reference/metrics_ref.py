# -*- coding: utf-8 -*-
"""
共通指標仕様書（shared/metrics-spec.md）の参照実装。

読みやすさを優先した最小の実装で、製品コードからは使いません。
基準データ（shared/golden/*.json）を作るため、そして仕様の解釈を確かめるためのものです。

使い方:
  python shared/reference/metrics_ref.py --write-golden   基準データを作り直す
  python shared/reference/metrics_ref.py --check          基準データと参照実装が一致するか確かめる
"""
import argparse
import json
import math
import os
import re
import statistics
import sys
import unicodedata
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
SHARED = os.path.dirname(HERE)
GOLDEN = os.path.join(SHARED, "golden")

KIND = {
    "liveChatTextMessageRenderer": "text",
    "liveChatPaidMessageRenderer": "money",
    "liveChatPaidStickerRenderer": "money",
    "liveChatMembershipItemRenderer": "member",
    "liveChatSponsorshipsGiftPurchaseAnnouncementRenderer": "member",
}


def spec_version():
    with open(os.path.join(SHARED, "VERSION"), encoding="utf-8") as f:
        return f.read().strip()


# ---------------------------------------------------------------- 2章 読み取り
def message_text(msg):
    if not msg:
        return ""
    if msg.get("simpleText"):
        return msg["simpleText"]
    out = []
    for r in msg.get("runs", []):
        if r.get("text"):
            out.append(r["text"])
        elif "emoji" in r:
            e = r["emoji"]
            if e.get("isCustomEmoji") and e.get("shortcuts"):
                out.append(e["shortcuts"][0])
            else:
                out.append(e.get("emojiId", ""))
    return "".join(out)


def parse_actions(actions):
    """アクションの列 → [[t, 種類, 本文], ...]（2章）"""
    items, seen = [], set()
    for order, a in enumerate(actions):
        rep = a.get("replayChatItemAction") if isinstance(a, dict) else None
        if not rep:
            continue
        raw = rep.get("videoOffsetTimeMsec")
        if raw is None or raw == "":
            continue
        try:
            ms = float(raw)
        except (TypeError, ValueError):
            continue
        if not (ms >= 0):          # 負・NaN を捨てる
            continue
        t = ms / 1000
        for act in rep.get("actions", []):
            item = (act.get("addChatItemAction") or {}).get("item") or {}
            for kind, r in item.items():
                typ = KIND.get(kind)
                if typ is None:
                    continue
                rid = r.get("id")
                if rid:
                    if rid in seen:
                        continue
                    seen.add(rid)
                text = "" if typ == "member" else message_text(r.get("message"))
                items.append((t, len(items), [t, typ, text]))
    items.sort(key=lambda x: (x[0], x[1]))
    return [x[2] for x in items]


# ---------------------------------------------------------------- 3章 計算
def normalize(s):
    s = unicodedata.normalize("NFKC", s)
    s = s.lower()
    s = s.strip()
    s = re.sub(r"\s+", " ", s)
    s = re.sub(r"(.)\1{3,}", r"\1\1\1", s)
    return s[:30]


def compute_metrics(items, duration, bin_sec):
    """チャット項目 → {bins, count, accel, same_rate}（3章）"""
    d = duration or (items[-1][0] if items else 0)
    n = max(1, math.ceil(d / bin_sec))
    count = [0] * n
    keys = [Counter() for _ in range(n)]
    for t, typ, text in items:
        if t < 0:
            continue
        i = min(n - 1, int(math.floor(t / bin_sec)))
        if typ == "member":
            continue
        count[i] += 1
        if text:
            k = normalize(text)
            if k:
                keys[i][k] += 1

    base = []
    for i in range(n):
        window = count[max(0, i - 10):min(n, i + 11)]
        base.append(max(1.0, float(statistics.median(window))))

    accel = [0.0] + [(count[i] - count[i - 1]) / base[i] for i in range(1, n)]

    same_rate = []
    for i in range(n):
        top = max(keys[i].values()) if keys[i] else 0
        same_rate.append(top / count[i] if count[i] >= 5 and top >= 3 else 0.0)

    return {"bins": n, "count": count, "accel": accel, "same_rate": same_rate}


# ---------------------------------------------------------------- 基準データ
def build_golden():
    sys.path.insert(0, HERE)
    import cases  # noqa: E402
    version = spec_version()
    parse = []
    for c in cases.parse_cases():
        parse.append({**c, "expected": parse_actions(c["actions"])})
    metrics = []
    for c in cases.metrics_cases():
        metrics.append({**c, "expected": compute_metrics(c["items"], c["duration"], c["bin_sec"])})
    return (
        {"spec_version": version, "note": "自動生成。手で編集しないこと（metrics_ref.py --write-golden）", "cases": parse},
        {"spec_version": version, "note": "自動生成。手で編集しないこと（metrics_ref.py --write-golden）", "cases": metrics},
    )


def dump(obj):
    return json.dumps(obj, ensure_ascii=False, indent=1) + "\n"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-golden", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    parse, metrics = build_golden()
    files = {"parse_cases.json": parse, "metrics_cases.json": metrics}
    if a.write_golden:
        os.makedirs(GOLDEN, exist_ok=True)
        for name, obj in files.items():
            with open(os.path.join(GOLDEN, name), "w", encoding="utf-8", newline="\n") as f:
                f.write(dump(obj))
        print("基準データを書き出しました:", ", ".join(files))
        return
    if a.check:
        ok = True
        for name, obj in files.items():
            with open(os.path.join(GOLDEN, name), encoding="utf-8") as f:
                if f.read() != dump(obj):
                    ok = False
                    print(f"不一致: {name}（--write-golden で作り直してください）")
        print("一致しています" if ok else "")
        sys.exit(0 if ok else 1)
    ap.print_help()


if __name__ == "__main__":
    main()
