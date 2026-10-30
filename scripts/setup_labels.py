# -*- coding: utf-8 -*-
"""GitHub のラベルを作る（初回のみ。gh auth login 済みであること）

  python scripts/setup_labels.py
"""
import subprocess
import sys

LABELS = [
    ("社長判断", "B60205", "社長の判断待ち（部長が起票）"),
    ("社長指示", "0E8A16", "社長からの依頼"),
    ("日報", "1D76DB", "部長の日報（月ごとに1件、毎日コメント）"),
    ("手戻り", "FBCA04", "工程の差し戻しが続いているもの"),
    ("共通仕様", "5319E7", "shared/（両部の共通指標仕様）に関わる"),
    ("部門間", "C5DEF5", "両部にまたがる事項"),
    ("不具合", "D93F0B", "不具合報告"),
    ("承認済み", "2EA44F", "社長が承認した"),
]


def main():
    ok = True
    for name, color, desc in LABELS:
        r = subprocess.run(["gh", "label", "create", name, "--color", color, "--description", desc, "--force"],
                           capture_output=True, text=True, encoding="utf-8")
        print(("作成/更新: " if r.returncode == 0 else "失敗: ") + name, r.stderr.strip())
        ok &= r.returncode == 0
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
