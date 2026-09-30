"""打包 Multi AI 扩展为商店 ZIP（Chrome Web Store 上架用）。
用法: python tools/pack_zip.py [版本号]
输出: multi-ai-<version>.zip（放在扩展目录父级）
"""
import json
import os
import sys
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # multi-ai/
MANIFEST = os.path.join(ROOT, "manifest.json")
VERSION = json.load(open(MANIFEST, encoding="utf-8"))["version"]
if len(sys.argv) > 1:
    VERSION = sys.argv[1]

EXCLUDE_DIRS = {"__pycache__", ".preview"}
EXCLUDE_FILES = {".DS_Store", "Thumbs.db"}

def main():
    out = os.path.join(os.path.dirname(ROOT), f"multi-ai-{VERSION}.zip")
    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for base, dirs, files in os.walk(ROOT):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
            for f in files:
                if f in EXCLUDE_FILES:
                    continue
                full = os.path.join(base, f)
                rel = os.path.relpath(full, ROOT)
                z.write(full, rel)
                count += 1
    size = os.path.getsize(out)
    print(f"OK -> {out}")
    print(f"files={count} size={size} bytes")

if __name__ == "__main__":
    main()
