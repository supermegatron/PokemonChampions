#!/usr/bin/env python3
import json
import sys
from pathlib import Path

import requests
from bs4 import BeautifulSoup

sys.path.insert(0, str(Path(__file__).resolve().parent))
from build_dataset import parse_stats_from_detail, slugify

HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; PokemonChampionsBot/1.0)"}
STAT_KEYS = {
    "HP": "hp",
    "Atk": "atk",
    "Atk.": "atk",
    "Attack": "atk",
    "Def": "def",
    "Defense": "def",
    "SpAtk": "spa",
    "Sp. Atk": "spa",
    "SpDef": "spd",
    "Sp. Def": "spd",
    "Speed": "spe",
    "Spe": "spe",
}


def parse_all_stat_tables(soup: BeautifulSoup) -> list[dict]:
    tables: list[dict] = []
    for table in soup.select("table"):
        rows = [
            [c.get_text(" ", strip=True) for c in tr.select("th, td")]
            for tr in table.select("tr")
        ]
        if not rows:
            continue
        header = rows[0]
        stats: dict[str, int] = {}
        if header[:1] == ["Stat"] and len(header) == 2 and header[1] == "Value":
            for row in rows[1:]:
                if len(row) == 2 and row[0] in STAT_KEYS and row[1].isdigit():
                    stats[STAT_KEYS[row[0]]] = int(row[1])
                if len(row) == 2 and row[0] == "Total" and row[1].isdigit():
                    stats["bst"] = int(row[1])
        elif header[:1] == ["Stat"] and "Max" in header:
            max_idx = header.index("Max")
            for row in rows[1:]:
                if len(row) > max_idx and row[0] in STAT_KEYS and row[max_idx].isdigit():
                    stats[STAT_KEYS[row[0]]] = int(row[max_idx])
        if stats:
            tables.append(stats)
    return tables


def fetch(url: str) -> BeautifulSoup:
    return BeautifulSoup(requests.get(url, headers=HEADERS, timeout=60).text, "html.parser")


def main() -> None:
    urls = {
        "Raichu": "https://game8.co/games/Pokemon-Champions/archives/592195",
        "Mega Raichu X": "https://game8.co/games/Pokemon-Champions/archives/605626",
        "Mega Raichu Y": "https://game8.co/games/Pokemon-Champions/archives/605627",
        "Tyranitar": "https://game8.co/games/Pokemon-Champions/archives/592188",
    }
    out = {}
    for name, url in urls.items():
        soup = fetch(url)
        out[name] = {
            "parse_stats_from_detail": parse_stats_from_detail(soup),
            "tables": parse_all_stat_tables(soup),
        }
    Path("inspect_game8_out.json").write_text(json.dumps(out, indent=2), encoding="utf-8")
    print("wrote inspect_game8_out.json")


if __name__ == "__main__":
    main()
