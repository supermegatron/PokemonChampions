#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup

HEADERS = {"User-Agent": "Mozilla/5.0"}
url = "https://game8.co/games/Pokemon-Champions/archives/592195"
soup = BeautifulSoup(requests.get(url, headers=HEADERS, timeout=60).text, "html.parser")

for h in soup.select("h2, h3, h4"):
    t = h.get_text(" ", strip=True)
    if "Stat" in t or "Raichu" in t or "Pikachu" in t:
        print("H:", repr(t))
        nxt = h.find_next("table")
        if nxt:
            rows = [[c.get_text(" ", strip=True) for c in tr.select("th, td")] for tr in nxt.select("tr")[:4]]
            print("  next table:", rows)
