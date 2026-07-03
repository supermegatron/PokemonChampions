#!/usr/bin/env python3
"""Build move-index.json (type + category) for M-B moves from Showdown data."""

from __future__ import annotations

import json
import re
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POKEMON = ROOT / "data" / "M-B" / "pokemon.json"
OUT = ROOT / "data" / "M-B" / "move-index.json"
URL = "https://raw.githubusercontent.com/smogon/pokemon-showdown/master/data/moves.ts"


def parse_moves_ts(text: str) -> dict[str, dict[str, str]]:
    """Parse Showdown moves.ts by move-id blocks (name/type/category live in same block)."""
    by_name: dict[str, dict[str, str]] = {}
    blocks = re.split(r"\n\t([a-z][a-z0-9]*):\s*\{", text)
    for i in range(1, len(blocks), 2):
        body = blocks[i + 1] if i + 1 < len(blocks) else ""
        name_m = re.search(r'name:\s*"([^"]+)"', body)
        type_m = re.search(r'type:\s*"([^"]+)"', body)
        cat_m = re.search(r'category:\s*"([^"]+)"', body)
        if name_m and type_m and cat_m:
            by_name[name_m.group(1)] = {
                "type": type_m.group(1),
                "category": cat_m.group(1),
            }
    return by_name


def main() -> None:
    text = urllib.request.urlopen(URL, timeout=60).read().decode("utf-8")
    by_name = parse_moves_ts(text)

    pool = json.loads(POKEMON.read_text(encoding="utf-8"))
    names: set[str] = set()
    for mon in pool.values():
        for mv in mon.get("moves", []):
            names.add(mv["name"])

    out: dict[str, dict[str, str]] = {}
    missing: list[str] = []
    for name in sorted(names):
        meta = by_name.get(name)
        if not meta:
            meta = next((v for k, v in by_name.items() if k.lower() == name.lower()), None)
        if meta:
            out[name] = meta
        else:
            missing.append(name)

    payload = {
        "source": "pokemon-showdown/data/moves.ts",
        "count": len(out),
        "missing": len(missing),
        "missingNames": missing,
        "moves": out,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} — {len(out)} moves, {len(missing)} missing")
    if missing:
        print("Still missing:", ", ".join(missing[:20]), "..." if len(missing) > 20 else "")


if __name__ == "__main__":
    main()
