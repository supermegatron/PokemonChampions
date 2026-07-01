#!/usr/bin/env python3
"""Fetch Regulation M-B legal held items from RotomPicks and write data/M-B/items.json."""

from __future__ import annotations

import json
import re
import time
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "PokemonChampions-data/1.0 (personal project)"}
URL = "https://rotompicks.com/en/items/"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "M-B" / "items.json"

HOLD = {
    "Big Root",
    "Black Belt",
    "Black Glasses",
    "Bright Powder",
    "Charcoal",
    "Choice Scarf",
    "Damp Rock",
    "Dragon Fang",
    "Expert Belt",
    "Fairy Feather",
    "Focus Band",
    "Focus Sash",
    "Hard Stone",
    "Heat Rock",
    "Icy Rock",
    "Iron Ball",
    "King's Rock",
    "Leftovers",
    "Life Orb",
    "Light Ball",
    "Light Clay",
    "Magnet",
    "Mental Herb",
    "Metal Coat",
    "Metronome",
    "Miracle Seed",
    "Muscle Band",
    "Mystic Water",
    "Never-Melt Ice",
    "Poison Barb",
    "Quick Claw",
    "Scope Lens",
    "Sharp Beak",
    "Shed Shell",
    "Shell Bell",
    "Silk Scarf",
    "Silver Powder",
    "Smooth Rock",
    "Soft Sand",
    "Spell Tag",
    "Twisted Spoon",
    "White Herb",
    "Wide Lens",
    "Wise Glasses",
    "Zoom Lens",
}

BERRIES = {
    "Aspear Berry",
    "Babiri Berry",
    "Charti Berry",
    "Cheri Berry",
    "Chesto Berry",
    "Chilan Berry",
    "Chople Berry",
    "Coba Berry",
    "Colbur Berry",
    "Haban Berry",
    "Kasib Berry",
    "Kebia Berry",
    "Leppa Berry",
    "Lum Berry",
    "Occa Berry",
    "Oran Berry",
    "Passho Berry",
    "Payapa Berry",
    "Pecha Berry",
    "Persim Berry",
    "Rawst Berry",
    "Rindo Berry",
    "Roseli Berry",
    "Shuca Berry",
    "Sitrus Berry",
    "Tanga Berry",
    "Wacan Berry",
    "Yache Berry",
}

TYPE_BOOST = {
    "Black Belt",
    "Black Glasses",
    "Charcoal",
    "Dragon Fang",
    "Fairy Feather",
    "Hard Stone",
    "Magnet",
    "Metal Coat",
    "Miracle Seed",
    "Mystic Water",
    "Never-Melt Ice",
    "Poison Barb",
    "Sharp Beak",
    "Silk Scarf",
    "Silver Powder",
    "Soft Sand",
    "Spell Tag",
    "Twisted Spoon",
}

CHOICE = {"Choice Scarf"}
RECOVERY = {"Leftovers", "Shell Bell", "Big Root"}
DEFENSIVE = {"Focus Band", "Focus Sash", "Shed Shell", "Iron Ball"}
OFFENSIVE = {"Life Orb", "Expert Belt", "Muscle Band", "Wise Glasses", "Scope Lens", "Metronome"}
SUPPORT = {
    "Light Clay",
    "Damp Rock",
    "Heat Rock",
    "Icy Rock",
    "Smooth Rock",
    "Mental Herb",
    "White Herb",
    "Bright Powder",
    "King's Rock",
    "Quick Claw",
    "Light Ball",
    "Wide Lens",
    "Zoom Lens",
}


def normalize_name(name: str) -> str:
    return name.replace("\u2019", "'").replace("\u2018", "'").strip()


def parse_rotompicks(html: str) -> list[dict]:
    soup = BeautifulSoup(html, "html.parser")
    items: list[dict] = []
    section = "held"

    for el in soup.select("h2, table"):
        if el.name == "h2":
            title = el.get_text(strip=True).lower()
            if "mega" in title:
                section = "mega"
            elif "berr" in title:
                section = "berry"
            elif "hold" in title:
                section = "held"
            continue

        for row in el.select("tr")[1:]:
            cells = row.select("td")
            if not cells:
                continue
            name = normalize_name(cells[0].get_text(strip=True))
            if not name:
                continue
            category = section if section != "held" else categorize_hold(name)
            items.append({"name": name, "category": category})

    return items


def categorize_hold(name: str) -> str:
    if name in CHOICE:
        return "choice"
    if name in TYPE_BOOST:
        return "type-boost"
    if name in RECOVERY:
        return "recovery"
    if name in DEFENSIVE:
        return "defensive"
    if name in OFFENSIVE:
        return "offensive"
    if name in SUPPORT:
        return "support"
    return "held"


def fetch_names() -> list[dict]:
    last_err: Exception | None = None
    for attempt in range(3):
        try:
            response = requests.get(URL, headers=HEADERS, timeout=45)
            response.raise_for_status()
            names = parse_rotompicks(response.text)
            if len(names) < 100:
                raise ValueError(f"Unexpected item count: {len(names)}")
            return names
        except Exception as err:  # noqa: BLE001
            last_err = err
            time.sleep(1.5 * (attempt + 1))
    raise last_err  # type: ignore[misc]


def sort_items(items: list[dict]) -> list[dict]:
    order = {
        "held": 0,
        "offensive": 1,
        "defensive": 2,
        "recovery": 3,
        "choice": 4,
        "support": 5,
        "type-boost": 6,
        "berry": 7,
        "mega": 8,
    }
    return sorted(items, key=lambda i: (order.get(i["category"], 9), i["name"].lower()))


def main() -> None:
    print(f"Fetching {URL} …")
    names = fetch_names()
    items = sort_items(names)
    payload = {
        "regulation": "M-B",
        "source": URL,
        "count": len(items),
        "scraped_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "items": items,
    }
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {len(items)} items -> {OUT}")


if __name__ == "__main__":
    main()
