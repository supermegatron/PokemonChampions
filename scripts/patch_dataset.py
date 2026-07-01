#!/usr/bin/env python3
"""Patch dataset: fix types + add Regulation M-B new pokemon."""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

from build_dataset import (
    CACHE_PATH,
    DATA_DIR,
    HEADERS,
    fetch,
    load_regulation,
    parse_abilities,
    parse_moves,
    parse_stats_from_detail,
    scrape_pokemon_detail,
    slugify,
)

ROOT = Path(__file__).resolve().parent.parent
MB_NEW_URL = "https://game8.co/games/Pokemon-Champions/archives/605517"

TYPE_PATTERN = re.compile(
    r"is a ((?:Normal|Fire|Water|Electric|Grass|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy)(?:/(?:Normal|Fire|Water|Electric|Grass|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy))*)-type",
    re.I,
)


def parse_types_from_meta(soup: BeautifulSoup) -> list[str]:
    meta = soup.select_one('meta[name="description"]')
    if meta and meta.get("content"):
        match = TYPE_PATTERN.search(meta["content"])
        if match:
            return match.group(1).split("/")
    for p in soup.select("p"):
        text = p.get_text(" ", strip=True)
        match = TYPE_PATTERN.search(text)
        if match:
            return match.group(1).split("/")
    return []


def get_mb_new_entries() -> list[dict]:
    soup = fetch(MB_NEW_URL)
    entries: list[dict] = []
    seen: set[str] = set()
    skip = {"Abilities", "New Pokemon", "Generation 1", "Generation 4", "Generation 7", "Normal", "Electric", "Fighting", "Flying", "Rock", "Dark", "Pokemon by Base Stats"}

    for table in soup.select("table"):
        for tr in table.select("tr"):
            link = tr.select_one('a[href*="/archives/60"]')
            if not link:
                continue
            name = link.get_text(strip=True)
            if not name or name in skip or name in seen:
                continue
            if name.startswith("June ") or name.startswith("Version"):
                continue
            href = link.get("href", "")
            url = href if href.startswith("http") else "https://game8.co" + href
            seen.add(name)
            entries.append({"name": name, "url": url.split("#")[0]})

    return entries


def rebuild_indexes(dataset: dict[str, dict]) -> None:
    index = [
        {
            "id": mon["id"],
            "name": mon["name"],
            "types": mon.get("types", []),
            "bst": mon.get("stats", {}).get("bst"),
            "mega": mon.get("mega_evolution", False),
        }
        for mon in sorted(dataset.values(), key=lambda m: m["name"].lower())
    ]

    abilities_index: dict[str, dict] = {}
    for mon in dataset.values():
        for ability in mon.get("abilities", []):
            bucket = abilities_index.setdefault(
                ability["name"],
                {"name": ability["name"], "description": ability["description"], "pokemon": []},
            )
            if mon["name"] not in bucket["pokemon"]:
                bucket["pokemon"].append(mon["name"])

    regulation = load_regulation()
    regulation["pokemon_count"] = len(dataset)
    regulation["scraped_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())

    (DATA_DIR / "regulation.json").write_text(json.dumps(regulation, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "abilities_index.json").write_text(
        json.dumps(abilities_index, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def fill_missing_speed(stats: dict) -> bool:
    """Some Game8 pages omit Spe; derive from BST when possible."""
    if "spe" in stats or not stats.get("bst"):
        return False
    known = sum(stats.get(k, 0) for k in ("hp", "atk", "def", "spa", "spd"))
    spe = stats["bst"] - known
    if spe > 0:
        stats["spe"] = spe
        return True
    return False


def main() -> None:
    pokemon_path = DATA_DIR / "pokemon.json"
    dataset: dict[str, dict] = json.loads(pokemon_path.read_text(encoding="utf-8"))

    print("Fixing types from meta descriptions...")
    fixed = 0
    for i, mon in enumerate(dataset.values(), 1):
        if mon.get("types"):
            continue
        url = mon.get("source_url")
        if not url:
            continue
        print(f"  [{i}] types -> {mon['name']}")
        soup = fetch(url)
        types = parse_types_from_meta(soup)
        if types:
            mon["types"] = types
            fixed += 1
        time.sleep(0.15)
    print(f"  fixed {fixed} types")

    print("Filling missing Speed from BST...")
    spe_fixed = sum(1 for mon in dataset.values() if fill_missing_speed(mon.get("stats", {})))
    print(f"  fixed {spe_fixed} speed stats")

    print("Adding M-B new pokemon...")
    cache: dict[str, dict] = {}
    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))

    added = 0
    for entry in get_mb_new_entries():
        name = entry["name"]
        slug = slugify(name)
        if slug in dataset:
            continue
        print(f"  + {name}")
        detail = scrape_pokemon_detail(name, entry["url"], parse_stats_from_detail(fetch(entry["url"])) or {})
        types = parse_types_from_meta(fetch(entry["url"]))
        record = {
            "id": slug,
            "name": name,
            "regulation": "M-B",
            "types": types or detail.get("types", []),
            "stats": detail.get("stats", {}),
            "abilities": detail.get("abilities", []),
            "moves": detail.get("moves", []),
            "mega_evolution": name.startswith("Mega "),
            "source_url": entry["url"],
            "added_in": "M-B",
        }
        dataset[slug] = record
        cache[slug] = record
        added += 1
        time.sleep(0.25)

    CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
    pokemon_path.write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    rebuild_indexes(dataset)
    print(f"Done. Total: {len(dataset)} (+{added} new)")


if __name__ == "__main__":
    main()
