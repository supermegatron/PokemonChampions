import json
from pathlib import Path

with open(Path(__file__).parents[1] / "data/M-B/pokemon.json", encoding="utf-8") as f:
    data = json.load(f)

owned = [
    "gholdengo", "raichu", "dragonite", "drampa", "sylveon",
    "whimsicott", "aggron", "tyranitar", "arcanine",
]
key = {
    "Fake Out", "Tailwind", "Parting Shot", "Will-O-Wisp", "Snarl", "Encore",
    "Taunt", "Thunder Wave", "Nuzzle", "Protect", "Helping Hand", "Trick Room",
    "Rock Slide", "Earthquake", "Stone Edge", "Make It Rain", "Hyper Voice",
    "Moonblast", "Draco Meteor", "Outrage", "Flare Blitz", "Extreme Speed",
    "Close Combat", "Iron Head", "Body Press", "Shadow Ball", "Flash Cannon",
    "Dragon Dance", "Hurricane", "Heat Wave", "Glare", "Yawn", "Icy Wind",
}

for pid in owned:
    m = data[pid]
    abs_ = [a["name"] + (" (HA)" if a.get("hidden") else "") for a in m["abilities"]]
    mv = sorted(x["name"] for x in m["moves"] if x["name"] in key)
    print(f"\n=== {m['name']} spe={m['stats'].get('spe', '?')} ===")
    print("ABS:", ", ".join(abs_))
    print("KEY:", ", ".join(mv))
