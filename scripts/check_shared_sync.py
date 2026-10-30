# -*- coding: utf-8 -*-
"""shared/（共通指標仕様）が両リポジトリで同じか確かめる。

  python scripts/check_shared_sync.py            隣のフォルダにある相手リポジトリと比べる
  python scripts/check_shared_sync.py --remote   GitHub上の相手リポジトリ（main）と比べる
  --warn-only  ずれていても終了コード0にする（CIの警告用）
"""
import argparse
import os
import sys
import urllib.request

OWNER = "potstudio0206"
OTHER = "VibeCodingYouTubeAnalysisApp"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHARED = os.path.join(ROOT, "shared")


def local_files():
    out = []
    for base, dirs, files in os.walk(SHARED):
        dirs[:] = [x for x in dirs if x != "__pycache__"]
        for f in files:
            if f.endswith(".pyc"):
                continue
            out.append(os.path.relpath(os.path.join(base, f), SHARED).replace(os.sep, "/"))
    return sorted(out)


def read_local(root, rel):
    try:
        with open(os.path.join(root, *rel.split("/")), "rb") as f:
            return f.read().replace(b"\r\n", b"\n")
    except FileNotFoundError:
        return None


def read_remote(rel):
    url = f"https://raw.githubusercontent.com/{OWNER}/{OTHER}/main/shared/{rel}"
    try:
        with urllib.request.urlopen(url, timeout=20) as r:
            return r.read().replace(b"\r\n", b"\n")
    except Exception:
        return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--remote", action="store_true")
    ap.add_argument("--warn-only", action="store_true")
    a = ap.parse_args()
    if a.remote:
        where = f"GitHub の {OTHER}（main）"
        other = read_remote
    else:
        sibling = os.path.join(os.path.dirname(ROOT), OTHER, "shared")
        if not os.path.isdir(sibling):
            print(f"相手リポジトリが見つかりません: {sibling}（--remote でGitHubと比べられます）")
            sys.exit(0 if a.warn_only else 2)
        where = sibling
        other = lambda rel: read_local(sibling, rel)  # noqa: E731
    diffs = []
    for rel in local_files():
        mine = read_local(SHARED, rel)
        theirs = other(rel)
        if theirs is None:
            diffs.append(f"相手に無い: shared/{rel}")
        elif mine != theirs:
            diffs.append(f"内容が違う: shared/{rel}")
    if not diffs:
        print(f"共通仕様は一致しています（比較先: {where}）")
        return
    msg = f"共通仕様が {where} とずれています:\n  " + "\n  ".join(diffs)
    if a.warn_only:
        print("::warning::" + msg.replace("\n", " / "))
        print(msg)
        return
    print(msg)
    sys.exit(1)


if __name__ == "__main__":
    main()
