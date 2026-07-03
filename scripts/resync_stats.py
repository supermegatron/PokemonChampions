#!/usr/bin/env python3
"""Re-sync in-game Lv50 stats from Game8 detail pages (and bulk index fallback)."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from build_dataset import DATA_DIR, fetch, parse_stats_from_detail, scrape_stats_index
from patch_dataset import get_mb_new_entries, rebuild_indexes

POKEMON_PATH = DATA_DIR / "pokemon.json"


def mb_url_by_name() -> dict[str, str]:
    return {e["name"]: e["url"] for e in get_mb_new_entries()}


def main() -> None:
    print("Loading Game8 bulk index (Lv50 fallback)...")
    _, bulk_stats = scrape_stats_index()

    dataset: dict[str, dict] = json.loads(POKEMON_PATH.read_text(encoding="utf-8"))
    mb_urls = mb_url_by_name()
    updated = 0
    skipped = 0
    errors: list[str] = []

    for i, mon in enumerate(sorted(dataset.values(), key=lambda m: m["name"].lower()), 1):
        name = mon["name"]
        url = mb_urls.get(name) or mon.get("source_url")
        stats = None
        if url:
            try:
                soup = fetch(url)
                stats = parse_stats_from_detail(soup, name)
            except Exception as exc:
                errors.append(f"{name}: fetch {exc}")

        if (not stats or not stats.get("bst")) and name in bulk_stats:
            stats = bulk_stats[name]

        if not stats or not stats.get("bst"):
            skipped += 1
            errors.append(f"{name}: no stats")
            continue

        old = mon.get("stats", {})
        if old != stats:
            mon["stats"] = stats
            if url:
                mon["source_url"] = url
            updated += 1
            print(
                f"[{i}] {name}: spe {old.get('spe')} -> {stats.get('spe')} "
                f"(def {old.get('def')} -> {stats.get('def')}, bst {stats.get('bst')})"
            )

        time.sleep(0.1)

    POKEMON_PATH.write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    rebuild_indexes(dataset)
    print(f"\nDone. Updated {updated}, skipped {skipped}, errors {len(errors)}")
    if errors[:10]:
        print("Sample errors:", errors[:10])


if __name__ == "__main__":
    main()
