#!/usr/bin/env python3
"""Download Pokémon sprites from PokemonDB into web/public/sprites/."""

from __future__ import annotations

import json
import re
import time
import unicodedata
from pathlib import Path

import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
ROOT = Path(__file__).resolve().parent.parent
POKEMON_JSON = ROOT / "data" / "M-B" / "pokemon.json"
OUT_DIR = ROOT / "web" / "public" / "sprites"
MANIFEST_PATH = OUT_DIR / "manifest.json"

# Our display name -> substring to match in img URL filename (without .png)
SPRITE_HINTS: dict[str, str | None] = {
    "Mega Charizard X": "charizard-mega-x",
    "Mega Charizard Y": "charizard-mega-y",
    "Mega Venusaur": "venusaur-mega",
    "Mega Blastoise": "blastoise-mega",
    "Mega Beedrill": "beedrill-mega",
    "Mega Pidgeot": "pidgeot-mega",
    "Mega Clefable": "clefable-mega",
    "Mega Alakazam": "alakazam-mega",
    "Mega Victreebel": "victreebel-mega",
    "Mega Slowbro": "slowbro-mega",
    "Mega Gengar": "gengar-mega",
    "Mega Kangaskhan": "kangaskhan-mega",
    "Mega Starmie": "starmie-mega",
    "Mega Pinsir": "pinsir-mega",
    "Mega Gyarados": "gyarados-mega",
    "Mega Aerodactyl": "aerodactyl-mega",
    "Mega Dragonite": "dragonite-mega",
    "Mega Meganium": "meganium-mega",
    "Mega Feraligatr": "feraligatr-mega",
    "Mega Ampharos": "ampharos-mega",
    "Mega Steelix": "steelix-mega",
    "Mega Scizor": "scizor-mega",
    "Mega Heracross": "heracross-mega",
    "Mega Skarmory": "skarmory-mega",
    "Mega Houndoom": "houndoom-mega",
    "Mega Tyranitar": "tyranitar-mega",
    "Mega Gardevoir": "gardevoir-mega",
    "Mega Sableye": "sableye-mega",
    "Mega Aggron": "aggron-mega",
    "Mega Medicham": "medicham-mega",
    "Mega Manectric": "manectric-mega",
    "Mega Sharpedo": "sharpedo-mega",
    "Mega Camerupt": "camerupt-mega",
    "Mega Altaria": "altaria-mega",
    "Mega Banette": "banette-mega",
    "Mega Chimecho": "chimecho-mega",
    "Mega Absol": "absol-mega",
    "Mega Glalie": "glalie-mega",
    "Mega Garchomp": "garchomp-mega",
    "Mega Lucario": "lucario-mega",
    "Mega Abomasnow": "abomasnow-mega",
    "Mega Excadrill": "excadrill-mega",
    "Mega Audino": "audino-mega",
    "Mega Chandelure": "chandelure-mega",
    "Mega Golurk": "golurk-mega",
    "Mega Chesnaught": "chesnaught-mega",
    "Mega Delphox": "delphox-mega",
    "Mega Greninja": "greninja-mega",
    "Mega Floette": "floette-mega",
    "Mega Hawlucha": "hawlucha-mega",
    "Mega Drampa": "drampa-mega",
    "Mega Crabominable": "crabominable-mega",
    "Mega Froslass": "froslass-mega",
    "Mega Emboar": "emboar-mega",
    "Mega Scovillain": "scovillain-mega",
    "Mega Glimmora": "glimmora-mega",
    "Mega Raichu X": "raichu-mega-x",
    "Mega Raichu Y": "raichu-mega-y",
    "Mega Sceptile": "sceptile-mega",
    "Mega Blaziken": "blaziken-mega",
    "Mega Swampert": "swampert-mega",
    "Mega Mawile": "mawile-mega",
    "Mega Metagross": "metagross-mega",
    "Mega Staraptor": "staraptor-mega",
    "Mega Scolipede": "scolipede-mega",
    "Mega Scrafty": "scrafty-mega",
    "Mega Eelektross": "eelektross-mega",
    "Mega Pyroar": "pyroar-mega",
    "Mega Malamar": "malamar-mega",
    "Mega Barbaracle": "barbaracle-mega",
    "Mega Dragalge": "dragalge-mega",
    "Mega Falinks": "falinks-mega",
    "Alolan Raichu": "raichu-alolan",
    "Alolan Ninetales": "ninetales-alolan",
    "Hisuian Arcanine": "arcanine-hisuian",
    "Hisuian Typhlosion": "typhlosion-hisuian",
    "Hisuian Samurott": "samurott-hisuian",
    "Hisuian Zoroark": "zoroark-hisuian",
    "Hisuian Goodra": "goodra-hisuian",
    "Hisuian Decidueye": "decidueye-hisuian",
    "Hisuian Avalugg": "avalugg-hisuian",
    "Galarian Slowbro": "slowbro-galarian",
    "Galarian Slowking": "slowking-galarian",
    "Galarian Stunfisk": "stunfisk-galarian",
    "Paldean Tauros (Combat Breed)": "tauros-paldean-combat",
    "Paldean Tauros (Blaze Breed)": "tauros-paldean-blaze",
    "Paldean Tauros (Aqua Breed)": "tauros-paldean-aqua",
    "Heat Rotom": "rotom-heat",
    "Wash Rotom": "rotom-wash",
    "Frost Rotom": "rotom-frost",
    "Fan Rotom": "rotom-fan",
    "Mow Rotom": "rotom-mow",
    "Midday Form Lycanroc": "lycanroc-midday",
    "Midnight Form Lycanroc": "lycanroc-midnight",
    "Dusk Form Lycanroc": "lycanroc-dusk",
    "Meowstic (Male)": "meowstic-male",
    "Meowstic (Female)": "meowstic-female",
    "Mega Meowstic (Male)": "meowstic-mega-male",
    "Mega Meowstic (Female)": "meowstic-mega-female",
    "Aegislash (Shield Forme)": "aegislash-shield",
    "Aegislash (Blade Forme)": "aegislash-blade",
    "Gourgeist (Average)": "gourgeist-average",
    "Gourgeist (Small)": "gourgeist-small",
    "Gourgeist (Large)": "gourgeist-large",
    "Gourgeist (Super)": "gourgeist-super",
    "Morpeko (Full Belly Mode)": "morpeko-full-belly",
    "Morpeko (Hangry Mode)": "morpeko-hangry",
    "Palafin (Zero Form)": "palafin-zero",
    "Palafin (Hero Form)": "palafin-hero",
    "Basculegion (Male)": "basculegion-male",
    "Basculegion (Female)": "basculegion-female",
    "Maushold (Family of Four)": "maushold-four",
    "Maushold (Family of Three)": "maushold-three",
    "Eternal Flower Floette": "floette-eternal",
}


def slugify_db(name: str) -> str:
    name = re.sub(r"\s*\([^)]*\)", "", name)
    name = name.replace("Alolan ", "").replace("Hisuian ", "").replace("Galarian ", "").replace("Paldean ", "")
    name = name.replace("Midday Form ", "").replace("Midnight Form ", "").replace("Dusk Form ", "")
    name = name.replace("Eternal Flower ", "")
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode("ascii")
    name = name.lower().strip()
    name = re.sub(r"[^a-z0-9]+", "-", name).strip("-")
    return name


def page_slug_for(name: str) -> str:
    if name in {"Heat Rotom", "Wash Rotom", "Frost Rotom", "Fan Rotom", "Mow Rotom"}:
        return "rotom"
    if name == "Eternal Flower Floette":
        return "floette"
    if name.startswith("Mega "):
        inner = name[5:].split("(")[0].strip()
        if inner.endswith(" X") or inner.endswith(" Y"):
            inner = inner[:-2].strip()
        return slugify_db(inner)
    return slugify_db(name.split("(")[0].strip())


def pick_sprite_url(name: str, urls: list[str]) -> str | None:
    if not urls:
        return None

    hint = SPRITE_HINTS.get(name)
    if hint:
        for url in urls:
            if hint in url:
                return url

    # Prefer Scarlet/Violet, then Sword/Shield, then any normal sprite
    for pattern in ("scarlet-violet/normal", "sword-shield/normal", "/normal/"):
        for url in urls:
            if pattern in url and "shiny" not in url and "back" not in url:
                base = name.split("(")[0].strip().lower().replace(" ", "-")
                if "mega" in name.lower() and "mega" not in url:
                    continue
                if hint is None and "mega" in url and not name.startswith("Mega"):
                    continue
                return url

    return urls[0]


def fetch_sprite_urls(page_slug: str) -> list[str]:
    url = f"https://pokemondb.net/sprites/{page_slug}"
    response = requests.get(url, headers=HEADERS, timeout=30)
    if response.status_code != 200:
        return []
    soup = BeautifulSoup(response.text, "html.parser")
    urls = []
    for img in soup.select("img"):
        src = img.get("src", "")
        if "img.pokemondb.net/sprites" in src and "/normal/" in src:
            urls.append(src)
    return urls


def download(url: str, dest: Path) -> bool:
    try:
        response = requests.get(url, headers=HEADERS, timeout=30)
        response.raise_for_status()
        dest.write_bytes(response.content)
        return True
    except requests.RequestException:
        return False


def main() -> None:
    pokemon: dict = json.loads(POKEMON_JSON.read_text(encoding="utf-8"))
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    manifest: dict[str, str] = {}
    page_cache: dict[str, list[str]] = {}
    ok = fail = 0

    for i, (pid, mon) in enumerate(pokemon.items(), 1):
        name = mon["name"]
        page_slug = page_slug_for(name)
        if page_slug not in page_cache:
            page_cache[page_slug] = fetch_sprite_urls(page_slug)
            time.sleep(0.15)

        urls = page_cache[page_slug]
        sprite_url = pick_sprite_url(name, urls)

        dest = OUT_DIR / f"{pid}.png"
        if sprite_url and download(sprite_url, dest):
            manifest[pid] = sprite_url
            ok += 1
            print(f"[{i}/{len(pokemon)}] OK  {name}")
        else:
            fail += 1
            print(f"[{i}/{len(pokemon)}] FAIL {name} (page={page_slug})")

    MANIFEST_PATH.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone: {ok} downloaded, {fail} failed -> {OUT_DIR}")


if __name__ == "__main__":
    main()
