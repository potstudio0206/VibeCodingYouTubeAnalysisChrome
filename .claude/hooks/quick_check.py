# -*- coding: utf-8 -*-
"""PostToolUse（Edit / Write）：編集したファイルの構文をすぐ確かめる。誤りがあれば Claude に伝える。"""
import json
import os
import shutil
import subprocess
import sys

from hooklib import read_input


def main():
    data = read_input()
    path = (data.get("tool_input") or {}).get("file_path") or ""
    if not path or not os.path.exists(path):
        return 0
    ext = os.path.splitext(path)[1].lower()
    err = None
    if ext == ".py":
        try:
            with open(path, encoding="utf-8") as f:
                compile(f.read(), path, "exec")
        except SyntaxError as e:
            err = f"Python の構文エラー: {os.path.basename(path)} {e.lineno}行目: {e.msg}"
        except UnicodeDecodeError:
            err = f"{os.path.basename(path)} は UTF-8 で保存してください"
    elif ext in (".js", ".mjs", ".cjs") and shutil.which("node"):
        r = subprocess.run(["node", "--check", path], capture_output=True, text=True, encoding="utf-8", errors="replace")
        if r.returncode != 0:
            err = "JavaScript の構文エラー:\n" + "\n".join(r.stderr.strip().splitlines()[:8])
    elif ext == ".json":
        try:
            with open(path, encoding="utf-8") as f:
                json.load(f)
        except Exception as e:
            err = f"JSON の書式エラー: {os.path.basename(path)}: {e}"
    if err:
        print(err, file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
