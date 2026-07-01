"""One-off: export team catalog from strategyTeams structure to data/M-B/teams/."""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "web" / "src" / "data" / "strategyTeams.js"
OUT = ROOT / "data" / "M-B" / "teams"

# Parse by exec after stub - simpler to embed JSON directly
CATALOG = {
    "seedVersion": 2,
    "ownedPokemonIds": [
        "gholdengo", "raichu", "dragonite", "drampa", "sylveon",
        "whimsicott", "aggron", "tyranitar", "arcanine",
    ],
    "teams": [],
}

DESCRIPTIONS = {}


def team(entry, desc):
    t = {k: v for k, v in entry.items() if k != "slots"}
    t["slots"] = entry["slots"]
    CATALOG["teams"].append(t)
    DESCRIPTIONS[entry["id"]] = desc


team(
    {
        "id": "team-cover-sand",
        "name": "Cover · Arena (tu roster)",
        "tags": ["cover"],
        "slots": [
            {"pokemonId": "tyranitar", "ability": "Sand Stream", "item": "Assault Vest",
             "moves": ["Rock Slide", "Stone Edge", "Snarl", "Protect"],
             "role": "nucleo", "roleLabel": "Lead · Chorro Arena", "owned": True},
            {"pokemonId": "arcanine", "ability": "Intimidate", "item": "Safety Goggles",
             "moves": ["Will-O-Wisp", "Snarl", "Flare Blitz", "Protect"],
             "role": "nucleo", "roleLabel": "Support · Intimidación + quemar", "owned": True},
            {"pokemonId": "aggron", "ability": "Sturdy", "item": "Leftovers",
             "moves": ["Rock Slide", "Iron Head", "Body Press", "Protect"],
             "role": "nucleo", "roleLabel": "Tanque · Roca bajo arena", "owned": True},
            {"pokemonId": "gholdengo", "ability": "Good As Gold", "item": "Life Orb",
             "moves": ["Make It Rain", "Shadow Ball", "Flash Cannon", "Protect"],
             "role": "nucleo", "roleLabel": "Carry especial", "owned": True},
            {"pokemonId": "whimsicott", "ability": "Prankster", "item": "Focus Sash",
             "moves": ["Tailwind", "Encore", "Moonblast", "Protect"],
             "role": "flex", "roleLabel": "Flex · Viento Afín si no va arena", "owned": True},
            {"pokemonId": "dragonite", "ability": "Multiscale", "item": "Life Orb",
             "moves": ["Extreme Speed", "Outrage", "Iron Head", "Protect"],
             "role": "senal", "roleLabel": "Señuelo · bait hyper offense", "owned": True},
        ],
    },
    {
        "description": "100% con lo que ya tienes. Tyranitar pone arena, Arcanine intimida y quema, Aggron tanquea con boost de SpDef, Gholdengo hace daño especial. Whimsicott y Dragonite en el 6 para flex/señuelo.",
        "recruitHint": "Cuando fiches: Excadrill sustituye a Dragonite como carry físico bajo arena.",
        "bringHint": "Bring habitual: 1 · 2 · 3 · 4 (a veces Whimsicott en lugar de Aggron)",
    },
)

team(
    {
        "id": "team-cover-tailwind",
        "name": "Cover · Viento Afín (tu roster)",
        "tags": ["cover"],
        "slots": [
            {"pokemonId": "whimsicott", "ability": "Prankster", "item": "Focus Sash",
             "moves": ["Tailwind", "Taunt", "Encore", "Moonblast"],
             "role": "nucleo", "roleLabel": "Lead · Viento Afín + Prankster", "owned": True},
            {"pokemonId": "raichu", "ability": "Lightning Rod", "item": "Focus Sash",
             "moves": ["Fake Out", "Nuzzle", "Encore", "Protect"],
             "role": "nucleo", "roleLabel": "Susto + parálisis", "owned": True},
            {"pokemonId": "sylveon", "ability": "Pixilate", "item": "Throat Spray",
             "moves": ["Hyper Voice", "Moonblast", "Yawn", "Protect"],
             "role": "nucleo", "roleLabel": "Spread hada · Pixilado", "owned": True},
            {"pokemonId": "dragonite", "ability": "Multiscale", "item": "Life Orb",
             "moves": ["Extreme Speed", "Outrage", "Iron Head", "Protect"],
             "role": "nucleo", "roleLabel": "Carry bajo Viento Afín", "owned": True},
            {"pokemonId": "drampa", "ability": "Cloud Nine", "item": "Leftovers",
             "moves": ["Glare", "Snarl", "Hyper Voice", "Protect"],
             "role": "flex", "roleLabel": "Flex · Rompemoldes + Deslumbrar", "owned": True},
            {"pokemonId": "tyranitar", "ability": "Sand Stream", "item": "Assault Vest",
             "moves": ["Rock Slide", "Stone Edge", "Snarl", "Protect"],
             "role": "senal", "roleLabel": "Señuelo · bait arena", "owned": True},
        ],
    },
    {
        "description": "Hiperofensa sin clima: Whimsicott pone Viento Afín, Raichu Susto, Sylveon Vozarrón Pixilado y Dragonite remata. Drampa y Tyranitar despistan en preview.",
        "recruitHint": "Cuando fiches: Incineroar mejora el slot de Intimidación; Pelipper abre camino a lluvia.",
        "bringHint": "Bring habitual: 1 · 2 · 3 · 4",
    },
)

team(
    {
        "id": "team-snow",
        "name": "Nieve · Velo Aurora",
        "tags": ["estrategia"],
        "slots": [
            {"pokemonId": "alolan-ninetales", "ability": "Snow Warning", "item": "Light Clay",
             "moves": ["Aurora Veil", "Blizzard", "Freeze-Dry", "Moonblast"],
             "role": "nucleo", "roleLabel": "Lead · setter + Velo Aurora"},
            {"pokemonId": "beartic", "ability": "Slush Rush", "item": "Life Orb",
             "moves": ["Icicle Crash", "Close Combat", "Protect", "Ice Punch"],
             "role": "nucleo", "roleLabel": "Carry · Quitanieves"},
            {"pokemonId": "incineroar", "ability": "Intimidate", "item": "Safety Goggles",
             "moves": ["Fake Out", "Parting Shot", "Flare Blitz", "Snarl"],
             "role": "nucleo", "roleLabel": "Support · Intimidación"},
            {"pokemonId": "abomasnow", "ability": "Snow Warning", "item": "Leftovers",
             "moves": ["Blizzard", "Giga Drain", "Ice Punch", "Protect"],
             "role": "flex", "roleLabel": "Flex · segundo hielo"},
            {"pokemonId": "vanilluxe", "ability": "Snow Warning", "item": "Focus Sash",
             "moves": ["Blizzard", "Freeze-Dry", "Protect", "Taunt"],
             "role": "senal", "roleLabel": "Señuelo · parece nieve doble"},
            {"pokemonId": "pelipper", "ability": "Drizzle", "item": "Damp Rock",
             "moves": ["Hurricane", "Tailwind", "Protect", "Weather Ball"],
             "role": "senal", "roleLabel": "Señuelo · bait lluvia"},
        ],
    },
    {
        "description": "Nevada + Velo Aurora, Beartic barrido e Incineroar molestando. Pelipper y Vanilluxe en el 6 para despistar.",
        "recruitHint": "",
        "bringHint": "Bring habitual: 1 · 2 · 3 · 4",
    },
)

team(
    {
        "id": "team-rain",
        "name": "Lluvia off-meta",
        "tags": ["estrategia"],
        "slots": [
            {"pokemonId": "pelipper", "ability": "Drizzle", "item": "Damp Rock",
             "moves": ["Hurricane", "Tailwind", "Protect", "Muddy Water"],
             "role": "nucleo", "roleLabel": "Lead · Llovizna + Viento Afín"},
            {"pokemonId": "beartic", "ability": "Swift Swim", "item": "Life Orb",
             "moves": ["Icicle Crash", "Close Combat", "Protect", "Superpower"],
             "role": "nucleo", "roleLabel": "Carry sorpresa · Nado Rápido"},
            {"pokemonId": "overqwil", "ability": "Swift Swim", "item": "Black Sludge",
             "moves": ["Gunk Shot", "Crunch", "Aqua Jet", "Protect"],
             "role": "nucleo", "roleLabel": "Molestador · veneno rápido"},
            {"pokemonId": "politoed", "ability": "Drizzle", "item": "Sitrus Berry",
             "moves": ["Encore", "Hypnosis", "Muddy Water", "Icy Wind"],
             "role": "flex", "roleLabel": "Flex · control (Encore)"},
            {"pokemonId": "swampert", "ability": "Torrent", "item": "Mega Stone",
             "moves": ["Wave Crash", "Earthquake", "Ice Punch", "Protect"],
             "role": "senal", "roleLabel": "Señuelo · bait Mega Swampert"},
            {"pokemonId": "primarina", "ability": "Liquid Voice", "item": "Choice Specs",
             "moves": ["Hyper Voice", "Moonblast", "Aqua Jet", "Psychic"],
             "role": "senal", "roleLabel": "Señuelo · lluvia especial"},
        ],
    },
    {
        "description": "Llovizna sin el Mega Swampert obvio: Beartic y Overqwil con Nado Rápido. Swampert y Primarina en el 6 para confundir preview.",
        "recruitHint": "",
        "bringHint": "Bring habitual: 1 · 2 · 3 · 4",
    },
)

team(
    {
        "id": "team-sand",
        "name": "Arena · Expulsarena",
        "tags": ["estrategia"],
        "slots": [
            {"pokemonId": "tyranitar", "ability": "Sand Stream", "item": "Assault Vest",
             "moves": ["Rock Slide", "Knock Off", "Protect", "Low Kick"],
             "role": "nucleo", "roleLabel": "Lead · Chorro Arena"},
            {"pokemonId": "sandaconda", "ability": "Sand Spit", "item": "Rocky Helmet",
             "moves": ["Glare", "Coil", "Earthquake", "Protect"],
             "role": "nucleo", "roleLabel": "Truco · Expulsarena"},
            {"pokemonId": "excadrill", "ability": "Sand Rush", "item": "Life Orb",
             "moves": ["Iron Head", "Earthquake", "Rock Slide", "Protect"],
             "role": "nucleo", "roleLabel": "Carry · Velo Arena"},
            {"pokemonId": "incineroar", "ability": "Intimidate", "item": "Safety Goggles",
             "moves": ["Fake Out", "Parting Shot", "Flare Blitz", "Snarl"],
             "role": "flex", "roleLabel": "Flex · Intimidación"},
            {"pokemonId": "hippowdon", "ability": "Sand Stream", "item": "Leftovers",
             "moves": ["Stealth Rock", "Earthquake", "Slack Off", "Rock Slide"],
             "role": "senal", "roleLabel": "Señuelo · segundo setter"},
            {"pokemonId": "pelipper", "ability": "Drizzle", "item": "Damp Rock",
             "moves": ["Hurricane", "Muddy Water", "Tailwind", "Protect"],
             "role": "senal", "roleLabel": "Señuelo · bait lluvia"},
        ],
    },
    {
        "description": "Chorro Arena clásico + Sandaconda reactivo (Expulsarena). Hippowdon y Pelipper en el 6 como señuelo de otro clima.",
        "recruitHint": "",
        "bringHint": "Bring habitual: 1 · 2 · 3 · 4",
    },
)

OUT.mkdir(parents=True, exist_ok=True)
(OUT / "catalog.json").write_text(json.dumps(CATALOG, ensure_ascii=False, indent=2), encoding="utf-8")
(OUT / "descriptions.json").write_text(json.dumps(DESCRIPTIONS, ensure_ascii=False, indent=2), encoding="utf-8")
print("written", len(CATALOG["teams"]), "teams")
