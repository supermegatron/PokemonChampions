#!/usr/bin/env python3
import json
import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}
urls = {
    "Beartic": "https://game8.co/games/Pokemon-Champions/archives/592300",
    "Raichu": "https://game8.co/games/Pokemon-Champions/archives/592195",
    "Mega Raichu Y": "https://game8.co/games/Pokemon-Champions/archives/605627",
    "Tyranitar": "https://game8.co/games/Pokemon-Champions/archives/592239",
}


def value_tables(soup):
    out = []
    for table in soup.select("table"):
        rows = [[c.get_text(" ", strip=True) for c in tr.select("th, td")] for tr in table.select("tr")]
        if rows and rows[0][:2] == ["Stat", "Value"]:
            stats = {rows[i][0]: rows[i][1] for i in range(1, len(rows)) if len(rows[i]) == 2}
            out.append(stats)
    return out


for name, url in urls.items():
    soup = BeautifulSoup(requests.get(url, headers=HEADERS, timeout=60).text, "html.parser")
    headings = []
    for h in soup.select("h2, h3, h4"):
        t = h.get_text(" ", strip=True)
        if "Stat" in t or name.split()[0] in t:
            headings.append(t)
    print(name, headings[:8])
    for i, t in enumerate(value_tables(soup)):
        print(f"  V{i}", t.get("Speed") or t.get("Spe"), "bst", t.get("Total"))
    print()
