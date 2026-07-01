"""Scan M-B pool for weather, status and archetype tools."""
import json
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "M-B" / "pokemon.json"

WEATHER_MOVES = {"Sunny Day", "Rain Dance", "Sandstorm", "Snowscape", "Chilly Reception"}


def move_names(mon):
    return {m["name"] for m in mon.get("moves", [])}


def ab_names(mon):
    return {a["name"] for a in mon.get("abilities", [])}


def main():
    with open(DATA, encoding="utf-8") as f:
        data = json.load(f)

    results = defaultdict(list)

    for slug, mon in data.items():
        name = mon.get("name", slug)
        moves = move_names(mon)
        abs_ = ab_names(mon)
        spd = mon.get("stats", {}).get("speed", 0)

        for ab in ["Drizzle", "Drought", "Sand Stream", "Snow Warning", "Sand Spit"]:
            if ab in abs_:
                results[f"setter_{ab}"].append({"name": name, "speed": spd, "types": mon.get("types", [])})

        for ab in ["Swift Swim", "Chlorophyll", "Sand Rush", "Sand Force", "Slush Rush", "Solar Power"]:
            if ab in abs_:
                results[f"abuser_{ab}"].append({"name": name, "speed": spd})

        if "Protosynthesis" in abs_ or "Orichalcum Pulse" in abs_:
            results["sun_paradox"].append(name)

        wm = sorted(moves & WEATHER_MOVES)
        if wm:
            results["manual_weather"].append({"name": name, "moves": wm})

        if "Cloud Nine" in abs_ or "Air Lock" in abs_:
            results["anti_weather"].append(name)

        if moves & {"Spore", "Sleep Powder", "Hypnosis", "Dark Void"}:
            results["sleep_direct"].append(name)
        if "Yawn" in moves:
            results["yawn"].append(name)
        if "Will-O-Wisp" in moves or "Burning Bulwark" in moves:
            results["burn"].append(name)
        if moves & {"Toxic", "Toxic Spikes", "Poison Gas"}:
            results["poison"].append(name)
        if moves & {"Thunder Wave", "Nuzzle", "Stun Spore", "Glare"}:
            results["para"].append(name)
        if "Trick Room" in moves:
            results["trick_room"].append({"name": name, "speed": spd})
        if "Perish Song" in moves:
            results["perish"].append(name)
        if "Tailwind" in moves:
            results["tailwind"].append(name)
        if "Fake Out" in moves:
            results["fake_out"].append(name)
        if moves & {"Follow Me", "Rage Powder"}:
            results["redirection"].append(name)
        for ab in ["Electric Surge", "Grassy Surge", "Psychic Surge", "Misty Surge"]:
            if ab in abs_:
                results["terrain_setter"].append({"name": name, "ability": ab, "speed": spd})
        if "Expanding Force" in moves:
            results["expanding_force"].append(name)
        if "Grassy Glide" in moves:
            results["grassy_glide"].append(name)
        if "Heat Wave" in moves or "Eruption" in moves:
            results["sun_spread"].append(name)
        if moves & {"Hydro Pump", "Muddy Water", "Surf", "Water Spout"} and "Swift Swim" in abs_:
            results["rain_sweeper"].append(name)
        if "Blizzard" in moves and ("Slush Rush" in abs_ or "Snow Warning" in abs_):
            results["snow_blizzard"].append(name)
        if "Aurora Veil" in moves:
            results["aurora_veil"].append(name)
        if "Intimidate" in abs_:
            results["intimidate"].append(name)
        if "Prankster" in abs_:
            results["prankster"].append(name)

    # sort setters/abusers by speed
    for key in list(results.keys()):
        if results[key] and isinstance(results[key][0], dict) and "speed" in results[key][0]:
            results[key] = sorted(results[key], key=lambda x: x["speed"], reverse=True)

    out = {
        "total": len(data),
        "results": {k: v for k, v in sorted(results.items())},
    }
    out_path = ROOT / "scripts" / "strategy_scan.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)

    print("total", len(data))
    for k, v in sorted(results.items()):
        if v and isinstance(v[0], dict):
            names = [x["name"] for x in v[:12]]
        else:
            names = v[:12]
        print(f"{k} ({len(v)}): {', '.join(names)}")


if __name__ == "__main__":
    main()
