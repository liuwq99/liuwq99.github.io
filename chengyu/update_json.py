import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent
JSON_FILES = sorted(ROOT.glob("*.json"))

# pinyin-pro is used by the companion Node script; this Python script is the
# canonical data transformer and delegates pronunciation generation to Node.
# Run with: node update_json.js


def validate_document(document, path):
    if not isinstance(document, dict) or not isinstance(document.get("分组"), list):
        raise ValueError(f"{path.name}: 缺少分组数组")
    total = 0
    for group in document["分组"]:
        if not isinstance(group.get("词条"), list):
            raise ValueError(f"{path.name}: 分组缺少词条数组")
        total += len(group["词条"])
        count_key = "成语数量" if "成语数量" in group else "词条数量"
        if group.get(count_key) != len(group["词条"]):
            raise ValueError(f"{path.name}: {count_key} 与实际数量不符")
    return total


if __name__ == "__main__":
    for path in JSON_FILES:
        document = json.loads(path.read_text(encoding="utf-8"))
        validate_document(document, path)
    print(f"可处理 JSON 文件：{len(JSON_FILES)} 个")
