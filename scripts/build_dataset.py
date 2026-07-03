#!/usr/bin/env python3
"""Build Pokemon Champions Regulation M-B dataset from Game8."""

from __future__ import annotations

import json
import re
import time
import unicodedata
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
BASE = "https://game8.co"
STATS_INDEX_URL = f"{BASE}/games/Pokemon-Champions/archives/593888"

ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data" / "M-B"
CACHE_DIR = ROOT / "scripts" / "cache"
CACHE_PATH = CACHE_DIR / "scrape_cache.json"

STAT_KEYS = {
    "HP": "hp",
    "Atk": "atk",
    "Atk.": "atk",
    "Def": "def",
    "SpA": "spa",
    "SpAtk": "spa",
    "SpD": "spd",
    "SpDef": "spd",
    "Spe": "spe",
    "Speed": "spe",
    "Total": "bst",
}


def _parse_stat_value_table(table) -> dict[str, int]:
    stats: dict[str, int] = {}
    rows = [
        [c.get_text(" ", strip=True) for c in tr.select("th, td")]
        for tr in table.select("tr")
    ]
    if not rows or rows[0][:2] != ["Stat", "Value"]:
        return stats
    for row in rows[1:]:
        if len(row) == 2 and row[0] in STAT_KEYS and row[1].isdigit():
            stats[STAT_KEYS[row[0]]] = int(row[1])
    return stats


def _collect_stat_value_tables(soup: BeautifulSoup) -> list[dict[str, int]]:
    tables: list[dict[str, int]] = []
    for table in soup.select("table"):
        stats = _parse_stat_value_table(table)
        if stats.get("bst"):
            tables.append(stats)
    return tables


def _pick_in_game_stats_tables(tables: list[dict[str, int]]) -> dict:
    """Lv50 in-game values are always the higher-BST Stat|Value table."""
    if not tables:
        return {}
    if len(tables) == 1:
        return tables[0]
    return max(tables, key=lambda s: s.get("bst", 0))


def parse_stats_from_detail(soup: BeautifulSoup, pokemon_name: str | None = None) -> dict:
    """In-game Lv50 stats from Game8 detail page (higher-BST Stat|Value table)."""
    if pokemon_name:
        for heading in soup.select("h2, h3, h4"):
            if heading.get_text(" ", strip=True) == f"{pokemon_name} Stats":
                section: list[dict[str, int]] = []
                for el in heading.find_all_next():
                    if el.name in ("h2", "h3") and el is not heading:
                        break
                    if el.name == "table":
                        stats = _parse_stat_value_table(el)
                        if stats.get("bst"):
                            section.append(stats)
                picked = _pick_in_game_stats_tables(section)
                if picked:
                    return picked
                break

    tables = _collect_stat_value_tables(soup)
    return _pick_in_game_stats_tables(tables)


def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")
    name = name.lower()
    name = re.sub(r"[^a-z0-9]+", "-", name).strip("-")
    return name or "unknown"


def fetch(url: str, retries: int = 3) -> BeautifulSoup:
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=HEADERS, timeout=45)
            response.raise_for_status()
            return BeautifulSoup(response.text, "html.parser")
        except requests.RequestException as err:
            last_err = err
            time.sleep(1.2 * (attempt + 1))
    raise last_err  # type: ignore[misc]


TYPE_FROM_TEXT = re.compile(
    r"is a ((?:Normal|Fire|Water|Electric|Grass|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy)(?:/(?:Normal|Fire|Water|Electric|Grass|Ice|Fighting|Poison|Ground|Flying|Psychic|Bug|Rock|Ghost|Dragon|Dark|Steel|Fairy))*)-type",
    re.I,
)


def parse_types(soup: BeautifulSoup, name: str) -> list[str]:
    meta = soup.select_one('meta[name="description"]')
    if meta and meta.get("content"):
        match = TYPE_FROM_TEXT.search(meta["content"])
        if match:
            return match.group(1).split("/")

    for p in soup.select("p"):
        text = p.get_text(" ", strip=True)
        if name.split()[0] in text:
            match = TYPE_FROM_TEXT.search(text)
            if match:
                return match.group(1).split("/")

    return []


def parse_abilities(soup: BeautifulSoup) -> list[dict]:
    abilities: list[dict] = []
    seen: set[str] = set()

    for table in soup.select("table"):
        rows = [[c.get_text(" ", strip=True) for c in tr.select("th, td")] for tr in table.select("tr")]
        if not rows or rows[0][:2] != ["Ability", "Effect"]:
            continue
        for row in rows[1:]:
            if len(row) < 2:
                continue
            raw_name, effect = row[0], row[1]
            if raw_name in ("Ability", "Effect"):
                continue
            hidden = "(Hidden)" in raw_name or "(HA)" in raw_name
            clean = re.sub(r"\(Hidden\)|\(HA\)", "", raw_name).strip()
            if clean and clean not in seen:
                seen.add(clean)
                abilities.append({"name": clean, "description": effect.strip(), "hidden": hidden})

    if abilities:
        return abilities

    # Fallback: inline in stats section text
    for heading in soup.select("h2, h3, h4"):
        if "Ability" not in heading.get_text(strip=True):
            continue
        text = heading.find_next(["p", "div"])
        if text:
            chunk = text.get_text(" ", strip=True)
            parts = re.split(r"\(Hidden\)|\(HA\)", chunk)
            if parts and parts[0].strip():
                abilities.append({"name": parts[0].strip(), "description": "", "hidden": "(Hidden)" in chunk or "(HA)" in chunk})

    return abilities


def parse_moves(soup: BeautifulSoup) -> list[dict]:
    moves: list[dict] = []
    seen: set[str] = set()

    for table in soup.select("table"):
        rows = [[c.get_text(" ", strip=True) for c in tr.select("th, td")] for tr in table.select("tr")]
        if not rows or rows[0][0] != "Move":
            continue

        i = 1
        while i < len(rows):
            row = rows[i]
            if not row or not row[0]:
                i += 1
                continue
            name = row[0]
            if name in ("Move", "—"):
                i += 1
                continue
            if len(row) >= 6 and (row[3].isdigit() or row[3] == "-"):
                description = ""
                if i + 1 < len(rows) and len(rows[i + 1]) == 1:
                    description = rows[i + 1][0]
                    i += 1
                if name not in seen:
                    seen.add(name)
                    moves.append(
                        {
                            "name": name,
                            "power": None if row[3] == "-" else int(row[3]),
                            "accuracy": None if row[4] == "-" else int(row[4]),
                            "pp": None if row[5] == "-" else int(row[5]),
                            "description": description,
                        }
                    )
            i += 1
        if moves:
            break

    return moves


def scrape_stats_index() -> tuple[list[dict], dict[str, dict]]:
    soup = fetch(STATS_INDEX_URL)
    roster: list[dict] = []
    stats_bulk: dict[str, dict] = {}

    for table in soup.select("table"):
        header = [c.get_text(strip=True) for c in table.select("tr:first-child th, tr:first-child td")]
        if not header or header[0] != "Pokemon" or "HP" not in header:
            continue

        col = {h: i for i, h in enumerate(header)}
        atk_col = col.get("Atk.", col.get("Atk"))
        spa_col = col.get("SpAtk", col.get("SpA"))
        spd_col = col.get("SpDef", col.get("SpD"))

        for tr in table.select("tr")[1:]:
            cells = [td.get_text(strip=True) for td in tr.select("td")]
            if len(cells) < 7:
                continue

            name = cells[col["Pokemon"]]
            link = tr.select_one("a")
            url = None
            if link and link.get("href"):
                href = link["href"]
                url = href if href.startswith("http") else BASE + href
                url = url.split("#")[0]

            stats = {
                "hp": int(cells[col["HP"]]),
                "atk": int(cells[atk_col]),
                "def": int(cells[col["Def"]]),
                "spa": int(cells[spa_col]),
                "spd": int(cells[spd_col]),
                "spe": int(cells[col["Spe"]]),
                "bst": int(cells[col["Total"]]),
            }
            stats_bulk[name] = stats
            roster.append({"name": name, "url": url, "stats": stats})

    return roster, stats_bulk


def scrape_pokemon_detail(name: str, url: str, fallback_stats: dict) -> dict:
    soup = fetch(url)
    stats = parse_stats_from_detail(soup, name) or fallback_stats
    return {
        "name": name,
        "slug": slugify(name),
        "url": url,
        "types": parse_types(soup, name),
        "stats": stats,
        "abilities": parse_abilities(soup),
        "moves": parse_moves(soup),
        "mega_evolution": name.startswith("Mega "),
    }


def load_regulation() -> dict:
    return {
        "id": "M-B",
        "name": "Regulation Set M-B",
        "start": "2026-06-17",
        "end": "2026-09-02",
        "format": "VGC Doubles",
        "level": 50,
        "species_clause": True,
        "item_clause": True,
        "mega_evolution_limit": 1,
        "new_megas": [
            "Mega Raichu X",
            "Mega Raichu Y",
            "Mega Sceptile",
            "Mega Blaziken",
            "Mega Swampert",
            "Mega Mawile",
            "Mega Metagross",
            "Mega Staraptor",
            "Mega Scolipede",
            "Mega Scrafty",
            "Mega Eelektross",
            "Mega Pyroar",
            "Mega Malamar",
            "Mega Barbaracle",
            "Mega Dragalge",
            "Mega Falinks",
        ],
        "sources": [
            STATS_INDEX_URL,
            "https://game8.co/games/Pokemon-Champions/archives/592129",
            "https://victoryroad.pro/champions-regulations/",
            "https://news.pokemon-home.com/en/page/776.html",
        ],
    }


def main() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    print("Scraping stats index (roster + base stats)...")
    roster, stats_bulk = scrape_stats_index()
    print(f"  {len(roster)} pokemon in index")

    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache: dict[str, dict] = {}
    if CACHE_PATH.exists():
        cache = json.loads(CACHE_PATH.read_text(encoding="utf-8"))

    dataset: dict[str, dict] = {}
    errors: list[dict] = []

    for i, entry in enumerate(roster, 1):
        name = entry["name"]
        url = entry.get("url")
        slug = slugify(name)

        if slug in cache and cache[slug].get("moves"):
            dataset[slug] = cache[slug]
            continue

        if not url:
            dataset[slug] = {
                "id": slug,
                "name": name,
                "regulation": "M-B",
                "types": [],
                "stats": entry["stats"],
                "abilities": [],
                "moves": [],
                "mega_evolution": name.startswith("Mega "),
                "source_url": None,
                "error": "missing detail URL",
            }
            errors.append({"name": name, "error": "missing detail URL"})
            continue

        print(f"  [{i}/{len(roster)}] {name}")
        try:
            detail = scrape_pokemon_detail(name, url, entry["stats"])
            record = {
                "id": slug,
                "name": name,
                "regulation": "M-B",
                "types": detail["types"],
                "stats": entry["stats"],
                "abilities": detail["abilities"],
                "moves": detail["moves"],
                "mega_evolution": detail["mega_evolution"],
                "source_url": url,
            }
            dataset[slug] = record
            cache[slug] = record
            CACHE_PATH.write_text(json.dumps(cache, ensure_ascii=False, indent=2), encoding="utf-8")
            time.sleep(0.25)
        except Exception as exc:
            print(f"    ERROR: {exc}")
            record = {
                "id": slug,
                "name": name,
                "regulation": "M-B",
                "types": [],
                "stats": entry["stats"],
                "abilities": [],
                "moves": [],
                "mega_evolution": name.startswith("Mega "),
                "source_url": url,
                "error": str(exc),
            }
            dataset[slug] = record
            errors.append({"name": name, "error": str(exc)})

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
    regulation["scrape_errors"] = len(errors)

    (DATA_DIR / "regulation.json").write_text(json.dumps(regulation, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "index.json").write_text(json.dumps(index, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "pokemon.json").write_text(json.dumps(dataset, ensure_ascii=False, indent=2), encoding="utf-8")
    (DATA_DIR / "abilities_index.json").write_text(
        json.dumps(abilities_index, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    if errors:
        (DATA_DIR / "scrape_errors.json").write_text(json.dumps(errors, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Done: {len(dataset)} pokemon -> {DATA_DIR}")
    if errors:
        print(f"  {len(errors)} errors logged")


if __name__ == "__main__":
    main()
