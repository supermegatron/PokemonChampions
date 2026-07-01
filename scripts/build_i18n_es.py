#!/usr/bin/env python3
"""Build official Spanish (es) labels for moves, abilities and items via PokeAPI."""

from __future__ import annotations

import json
import re
import time
import unicodedata
from pathlib import Path

import requests

HEADERS = {"User-Agent": "PokemonChampions-i18n/1.0 (personal project)"}
ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "M-B"
OUT = DATA / "translations"
CACHE = Path(__file__).resolve().parent / "cache" / "i18n_detail"
POKEMON_PATH = DATA / "pokemon.json"
ITEMS_PATH = DATA / "items.json"

MOVE_OVERRIDES: dict[str, str] = {}
ABILITY_OVERRIDES: dict[str, str] = {
    "Fire Mane": "Crin de Fuego",
    "Eelevate": "Impulso Anguila",
}
ITEM_OVERRIDES: dict[str, str] = {
    "King's Rock": "Roca del Rey",
    "Raichunite X": "Raichunita X",
    "Raichunite Y": "Raichunita Y",
    "Dragoninite": "Dragonita",
    "Drampanite": "Drampanita",
    "Barbaracite": "Barbaracita",
    "Chimechite": "Chimechita",
    "Clefablite": "Clefablita",
    "Crabominite": "Crabominabita",
    "Delphoxite": "Delphoxita",
    "Dragalgite": "Dragalgita",
    "Eelektrossite": "Eelektrossita",
    "Emboarite": "Emboarita",
    "Excadrite": "Excadrilita",
    "Falinksite": "Falinksita",
    "Feraligite": "Feraligita",
    "Floettite": "Floettita",
    "Froslassite": "Froslassita",
    "Glimmoranite": "Glimmoranita",
    "Hawluchanite": "Hawluchanita",
    "Pyroarite": "Pyroarita",
    "Sceptilite": "Sceptilita",
    "Scolipite": "Scolipita",
    "Scovillainite": "Scovillainita",
    "Scraftinite": "Scraftinita",
    "Staraptite": "Staraptita",
    "Starminite": "Starminita",
    "Victreebelite": "Victreebelita",
    "Charizardite X": "Charizardita X",
    "Charizardite Y": "Charizardita Y",
    "Chandelurite": "Chandelurita",
    "Chesnaughtite": "Chesnaughtita",
    "Golurkite": "Golurkita",
    "Greninjite": "Greninjitita",
    "Malamarite": "Malamarita",
    "Meganiumite": "Meganiumita",
    "Meowsticite": "Meowsticita",
    "Skarmorite": "Skarmorita",
}


def slugify(name: str) -> str:
    name = unicodedata.normalize("NFKD", name)
    name = name.encode("ascii", "ignore").decode("ascii")
    name = name.lower().replace("'", "")
    name = re.sub(r"[^a-z0-9]+", "-", name).strip("-")
    return name or "unknown"


def pick_name(names: list[dict], lang: str) -> str | None:
    for entry in names:
        if entry.get("language", {}).get("name") == lang:
            return entry.get("name")
    return None


def fetch_detail(resource: str, slug: str) -> dict | None:
    CACHE.mkdir(parents=True, exist_ok=True)
    cache_path = CACHE / f"{resource}_{slug}.json"
    if cache_path.exists():
        return json.loads(cache_path.read_text(encoding="utf-8"))

    url = f"https://pokeapi.co/api/v2/{resource}/{slug}"
    for attempt in range(3):
        try:
            r = requests.get(url, headers=HEADERS, timeout=25)
            if r.status_code == 404:
                return None
            r.raise_for_status()
            data = r.json()
            cache_path.write_text(json.dumps(data, ensure_ascii=False), encoding="utf-8")
            time.sleep(0.06)
            return data
        except Exception:  # noqa: BLE001
            time.sleep(0.5 * (attempt + 1))
    return None


def resolve_names(
    names: set[str],
    resource: str,
    overrides: dict[str, str],
) -> tuple[dict[str, str], list[str]]:
    out: dict[str, str] = {}
    missing: list[str] = []

    for name in sorted(names):
        if name in overrides:
            out[name] = overrides[name]
            continue

        detail = fetch_detail(resource, slugify(name))
        if detail:
            es = pick_name(detail.get("names", []), "es")
            en = pick_name(detail.get("names", []), "en")
            if es and (en == name or detail.get("name") == slugify(name)):
                out[name] = es
                continue

        missing.append(name)
        out[name] = name

    return out, missing


def collect_from_pokemon() -> tuple[set[str], set[str]]:
    pokemon = json.loads(POKEMON_PATH.read_text(encoding="utf-8"))
    moves: set[str] = set()
    abilities: set[str] = set()
    for mon in pokemon.values():
        for m in mon.get("moves", []):
            if m.get("name"):
                moves.add(m["name"])
        for a in mon.get("abilities", []):
            if a.get("name"):
                abilities.add(a["name"])
    return moves, abilities


def collect_items() -> set[str]:
    data = json.loads(ITEMS_PATH.read_text(encoding="utf-8"))
    return {i["name"] for i in data.get("items", []) if i.get("name")}


def write_bundle(filename: str, key: str, mapping: dict[str, str], missing: list[str]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    payload = {
        "source": "https://pokeapi.co (language: es — Spanish, Spain)",
        "key": key,
        "count": len(mapping),
        "missing": missing,
        "labels": dict(sorted(mapping.items())),
    }
    path = OUT / filename
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {path} ({len(mapping)} entries, {len(missing)} missing)")


def main() -> None:
    move_names, ability_names = collect_from_pokemon()
    item_names = collect_items()
    print(f"Resolving {len(move_names)} moves, {len(ability_names)} abilities, {len(item_names)} items…")

    moves, moves_missing = resolve_names(move_names, "move", MOVE_OVERRIDES)
    abilities, abilities_missing = resolve_names(ability_names, "ability", ABILITY_OVERRIDES)
    items, items_missing = resolve_names(item_names, "item", ITEM_OVERRIDES)

    write_bundle("moves_es.json", "moves", moves, moves_missing)
    write_bundle("abilities_es.json", "abilities", abilities, abilities_missing)
    write_bundle("items_es.json", "items", items, items_missing)


if __name__ == "__main__":
    main()
