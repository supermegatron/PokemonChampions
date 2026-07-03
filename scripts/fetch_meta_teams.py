#!/usr/bin/env python3
"""Scrape Regulation M-B meta teams from Pikalytics into data/M-B/meta/pikalytics-mb.json."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "PokemonChampions-meta/1.0 (personal project)"}
URL = "https://www.pikalytics.com/pokedex/battledataregmbs3"
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "data" / "M-B" / "meta" / "pikalytics-mb.json"
INDEX = ROOT / "data" / "M-B" / "index.json"

# Pikalytics href slug -> Champions id (exceptions)
PIKA_SLUG_TO_ID: dict[str, str] = {
    "Charizard-Mega-X": "mega-charizard-x",
    "Charizard-Mega-Y": "mega-charizard-y",
    "Venusaur-Mega": "mega-venusaur",
    "Swampert-Mega": "mega-swampert",
    "Floette-Eternal": "eternal-flower-floette",
    "Floette-Eternal-Mega": "mega-floette",
    "Froslass-Mega": "mega-froslass",
    "Scovillain-Mega": "mega-scovillain",
    "Aerodactyl-Mega": "mega-aerodactyl",
    "Staraptor-Mega": "mega-staraptor",
    "Raichunite-X": "mega-raichu-x",
    "Raichunite-Y": "mega-raichu-y",
    "Raichu-Mega-X": "mega-raichu-x",
    "Raichu-Mega-Y": "mega-raichu-y",
    "Metagross-Mega": "mega-metagross",
    "Garchomp-Mega": "mega-garchomp",
    "Delphox-Mega": "mega-delphox",
    "Arcanine-Hisui": "hisuian-arcanine",
    "Basculegion": "basculegion-male",
    "Maushold": "maushold-family-of-four",
    "Lycanroc": "midday-form-lycanroc",
    "Rotom-Wash": "wash-rotom",
    "Kangaskhan-Mega": "mega-kangaskhan",
    "Ninetales-Alola": "alolan-ninetales",
    "Raichu-Alola": "alolan-raichu",
}


def load_name_maps() -> tuple[dict[str, str], set[str]]:
    index = json.loads(INDEX.read_text(encoding="utf-8"))
    by_name: dict[str, str] = {}
    legal: set[str] = set()
    for entry in index:
        pid = entry["id"]
        legal.add(pid)
        by_name[entry["name"].lower()] = pid
        by_name[pid] = pid
    return by_name, legal


def pika_slug_to_id(slug: str, by_name: dict[str, str]) -> str | None:
    if slug in PIKA_SLUG_TO_ID:
        return PIKA_SLUG_TO_ID[slug]
    if slug in by_name:
        return by_name[slug]

    m = re.match(r"^(.+)-Mega-([XY])$", slug)
    if m:
        return f"mega-{m.group(1).lower()}-{m.group(2).lower()}"

    if slug.endswith("-Mega"):
        base = slug[: -len("-Mega")].lower().replace(" ", "-")
        return f"mega-{base}"

    plain = slug.lower().replace(" ", "-")
    if plain in by_name:
        return by_name[plain]
    return by_name.get(slug.lower())


def parse_top20(soup: BeautifulSoup, by_name: dict[str, str]) -> list[dict]:
    out: list[dict] = []
    for i, card in enumerate(soup.select(".tournament-top20-card"), start=1):
        name_el = card.select_one(".tournament-top20-name")
        href = card.get("href", "")
        slug = href.rstrip("/").split("/")[-1] if href else (name_el.get_text(strip=True) if name_el else "")
        display = name_el.get_text(strip=True) if name_el else slug
        out.append(
            {
                "rank": i,
                "name": display,
                "pokemonId": pika_slug_to_id(slug, by_name),
                "slug": slug,
            }
        )
    return out


def parse_cores(soup: BeautifulSoup, by_name: dict[str, str]) -> list[dict]:
    cores: list[dict] = []
    for column in soup.select(".pokedex-format-core-column"):
        tier_el = column.select_one(".pokedex-format-core-column-header h3")
        tier = tier_el.get_text(strip=True) if tier_el else ""
        for card in column.select(".pokedex-format-core-entry"):
            rank_el = card.select_one(".pokedex-format-core-rank")
            names_div = card.select_one(".pokedex-format-core-pokemon-names")
            meta_div = card.select_one(".pokedex-format-core-meta")
            if not names_div:
                continue
            links = names_div.select("a.pokedex-format-core-pokemon-link")
            pokemon = []
            for a in links:
                slug = a.get("href", "").rstrip("/").split("/")[-1]
                pokemon.append(
                    {
                        "name": a.get_text(strip=True),
                        "pokemonId": pika_slug_to_id(slug, by_name),
                        "slug": slug,
                    }
                )
            meta_spans = meta_div.select("span") if meta_div else []
            teams_count = meta_spans[0].get_text(strip=True) if len(meta_spans) > 0 else ""
            usage = meta_spans[1].get_text(strip=True) if len(meta_spans) > 1 else ""
            cores.append(
                {
                    "tier": tier,
                    "rank": rank_el.get_text(strip=True) if rank_el else "",
                    "pokemon": pokemon,
                    "teamsLabel": teams_count,
                    "usageLabel": usage,
                }
            )
    return cores


def parse_team_entry(entry: BeautifulSoup, by_name: dict[str, str]) -> dict:
    rank = entry.select_one(".pokedex-format-team-rank")
    author = entry.select_one(".pokedex-format-team-author")
    record = entry.select_one(".pokedex-format-team-record")
    meta = entry.select_one(".pokedex-format-team-meta")

    strip_names: list[str] = []
    for img in entry.select(".team-pokemon-strip img[alt]"):
        strip_names.append(img["alt"])

    slots = []
    for card in entry.select(".team-pokemon-card"):
        name_a = card.select_one("a.team-pokemon-name")
        slug = ""
        if name_a and name_a.get("href"):
            slug = name_a["href"].rstrip("/").split("/")[-1]
        name = name_a.get_text(strip=True) if name_a else slug

        ability = ""
        item = ""
        for row in card.select(".team-pokemon-prop-row"):
            label = row.select_one(".team-prop-label")
            val = row.select_one(".team-prop-val-text")
            if not label or not val:
                continue
            key = label.get_text(strip=True).lower()
            if key == "ability":
                ability = val.get_text(strip=True)
            elif key == "item":
                item = val.get_text(strip=True)

        moves = [
            m.get_text(strip=True)
            for m in card.select(".team-move-entry .team-move-name")
            if m.get_text(strip=True)
        ]

        slots.append(
            {
                "name": name,
                "pokemonId": pika_slug_to_id(slug or name, by_name),
                "slug": slug or name,
                "ability": ability,
                "item": item,
                "moves": moves[:4],
            }
        )

    tournament = meta.get_text(" ", strip=True) if meta else ""
    return {
        "rank": rank.get_text(strip=True) if rank else "",
        "author": author.get_text(strip=True) if author else "",
        "record": record.get_text(strip=True) if record else "",
        "tournament": tournament,
        "roster": strip_names,
        "slots": slots,
    }


def parse_teams(soup: BeautifulSoup, by_name: dict[str, str]) -> list[dict]:
    teams = []
    for entry in soup.select(".aggregated-team-entry"):
        team = parse_team_entry(entry, by_name)
        if team["slots"]:
            teams.append(team)
    return teams


def scrape() -> dict:
    by_name, legal = load_name_maps()
    resp = requests.get(URL, headers=HEADERS, timeout=90)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")

    top20 = parse_top20(soup, by_name)
    cores = parse_cores(soup, by_name)
    teams = parse_teams(soup, by_name)

    unknown = set()
    for team in teams:
        for slot in team["slots"]:
            if slot["pokemonId"] and slot["pokemonId"] not in legal:
                unknown.add(slot["pokemonId"])
            if not slot["pokemonId"]:
                unknown.add(slot.get("slug") or slot.get("name"))

    return {
        "regulation": "M-B",
        "source": URL,
        "sourceName": "Pikalytics",
        "scrapedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "top20": top20,
        "cores": cores,
        "teams": teams,
        "teamCount": len(teams),
        "unmappedSlugs": sorted(unknown),
    }


def main() -> int:
    payload = scrape()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {OUT} ({payload['teamCount']} teams, {len(payload['cores'])} cores)")
    if payload["unmappedSlugs"]:
        print("Unmapped:", ", ".join(payload["unmappedSlugs"][:10]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
